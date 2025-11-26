import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuth } from '../../lib/auth-context';
import { useData } from '../../lib/data-context';
import { JobCategories } from '../../types/jobs';


type ListingType = 'trenger-jobber' | 'jobbsoker';

export default function NewJobPage() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createJob } = useData();
  const [listingType, setListingType] = useState<ListingType>('trenger-jobber');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<string>('');
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [limitedProfile, setLimitedProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookingUpPostal, setLookingUpPostal] = useState(false);
  const colorScheme = useColorScheme();
  const postalRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => postalRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Tillatelse nødvendig', 'Vi trenger tilgang til kameraet for å ta bilder');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Tillatelse nødvendig', 'Vi trenger tilgang til bildebiblioteket');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const lookupPostalCode = async (code: string) => {
    if (code.length !== 4) {
      setCity('');
      return;
    }

    try {
      setLookingUpPostal(true);
      const response = await fetch(`https://api.bring.com/shippingguide/api/postalCode.json?clientUrl=fortgjort.no&pnr=${code}`);
      const data = await response.json();
      
      if (data.valid && data.result) {
        // Convert to title case (first letter uppercase, rest lowercase)
        const cityName = data.result.toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase());
        setCity(cityName);
      } else {
        setCity('');
        Alert.alert('Ugyldig postnummer', 'Fant ikke poststed for dette postnummeret');
      }
    } catch (error) {
      console.error('Postal code lookup error:', error);
      setCity('');
    } finally {
      setLookingUpPostal(false);
    }
  };

  const handlePostalCodeChange = (code: string) => {
    setPostalCode(code);
    if (code.length === 4) {
      lookupPostalCode(code);
    } else {
      setCity('');
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!category) errors.push('kategori');
    if (!title.trim()) errors.push('annonseoverskrift');
    if (!description.trim()) errors.push('beskrivelse');
    if (!price.trim()) errors.push('pris');
    if (!postalCode.trim() || postalCode.length !== 4) errors.push('postnummer');
    if (!city) errors.push('poststed');
    return errors;
  };

  const getValidationMessage = () => {
    const errors = validateForm();
    if (errors.length === 0) return null;
    if (errors.length === 1) {
      return `Du må rette opp ${errors[0]}.`;
    }
    return `Du må rette opp ${errors[0]} og minst ${errors.length - 1} andre felter.`;
  };

  const handlePost = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Mangler informasjon', getValidationMessage() || 'Vennligst fyll ut alle feltene');
      return;
    }

    if (!user?.id) {
      Alert.alert('Feil', 'Du må være logget inn for å legge ut oppdrag');
      return;
    }

    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Ugyldig pris', 'Vennligst oppgi en gyldig pris');
      return;
    }

    try {
      setIsSubmitting(true);
      await createJob({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        location: `${city}, ${postalCode}`,
        category,
        status: 'open',
        created_by: user.id,
        images: images,
      });
      
      Alert.alert('Suksess! 🎉', 'Oppdraget ble publisert', [
        { text: 'OK', onPress: () => {
          // Clear form
          setImages([]);
          setTitle('');
          setDescription('');
          setPrice('');
          setPostalCode('');
          setCity('');
          setCategory('');
          setLimitedProfile(false);
          // Navigate to my jobs
          router.push('/(tabs)/mine-jobber');
        }}
      ]);
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke publisere oppdraget. Prøv igjen senere.');
      console.error('Failed to create job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.closeButton, { color: Colors[colorScheme].tint }]}>Lukk</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mine-jobber')}>
          <Text style={[styles.myJobsButton, { color: Colors[colorScheme].tint }]}>Mine jobber</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {/* Image upload section */}
        <BlurView 
          intensity={95} 
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={styles.imageSection}
        >
          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={[styles.removeImageButton, { backgroundColor: Colors[colorScheme].error }]}
                    onPress={() => removeImage(index)}
                  >
                    <FontAwesome name="times" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={[styles.primaryImageBadge, { backgroundColor: Colors[colorScheme].tint }]}>
                      <Text style={styles.primaryImageText}>Hovedbilde</Text>
                    </View>
                  )}
                </View>
              ))}
              {images.length < 10 && (
                <TouchableOpacity 
                  style={[styles.addMoreButton, { borderColor: Colors[colorScheme].border }]}
                  onPress={pickImageFromLibrary}
                >
                  <FontAwesome name="plus" size={32} color={Colors[colorScheme].textMuted} />
                  <Text style={[styles.addMoreText, { color: Colors[colorScheme].textMuted }]}>Legg til</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <View style={styles.imageUploadRow}>
              <TouchableOpacity 
                style={[styles.imageButton, { borderColor: Colors[colorScheme].border }]}
                onPress={pickImageFromCamera}
              >
                <FontAwesome name="camera" size={32} color={Colors[colorScheme].textMuted} />
                <Text style={[styles.imageButtonLabel, { color: Colors[colorScheme].textMuted }]}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.imageButton, { borderColor: Colors[colorScheme].border }]}
                onPress={pickImageFromLibrary}
              >
                <FontAwesome name="image" size={32} color={Colors[colorScheme].textMuted} />
                <Text style={[styles.imageButtonLabel, { color: Colors[colorScheme].textMuted }]}>Bibliotek</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.imageButton, { borderColor: Colors[colorScheme].border }]}
                onPress={pickImageFromLibrary}
              >
                <FontAwesome name="bars" size={32} color={Colors[colorScheme].textMuted} />
                <Text style={[styles.imageButtonLabel, { color: Colors[colorScheme].textMuted }]}>Organiser</Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>

        {/* Listing type selector */}
        <View style={styles.typeSelector}>
          <BlurView 
            intensity={95} 
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[styles.typeButton, listingType === 'trenger-jobber' && styles.typeButtonActive]}
          >
            <TouchableOpacity 
              style={styles.typeButtonInner}
              onPress={() => setListingType('trenger-jobber')}
            >
              <Text style={[styles.typeButtonText, { color: listingType === 'trenger-jobber' ? Colors[colorScheme].text : Colors[colorScheme].textMuted }]}>
                Trenger jobber
              </Text>
            </TouchableOpacity>
          </BlurView>
          <BlurView 
            intensity={95} 
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[styles.typeButton, listingType === 'jobbsoker' && styles.typeButtonActive]}
          >
            <TouchableOpacity 
              style={styles.typeButtonInner}
              onPress={() => setListingType('jobbsoker')}
            >
              <Text style={[styles.typeButtonText, { color: listingType === 'jobbsoker' ? Colors[colorScheme].text : Colors[colorScheme].textMuted }]}>
                Søker jobb
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Category */}
        <TouchableOpacity 
          style={[styles.field, { borderColor: Colors[colorScheme].border }]}
          onPress={() => setCategoryPickerVisible(true)}
        >
          <Text style={[styles.fieldLabel, { color: Colors[colorScheme].textMuted }]}>Kategori</Text>
          <View style={styles.fieldValueRow}>
            <Text style={[styles.fieldValue, { color: category ? Colors[colorScheme].text : Colors[colorScheme].textMuted }]}>
              {category ? JobCategories[category as keyof typeof JobCategories] : 'Velg kategori'}
            </Text>
            <FontAwesome name="chevron-right" size={14} color={Colors[colorScheme].textMuted} />
          </View>
        </TouchableOpacity>

        {/* Title (Annonseoverskrift) */}
        <View style={[styles.field, { borderColor: Colors[colorScheme].border }]}>
          <Text style={[styles.fieldLabel, { color: Colors[colorScheme].textMuted }]}>Annonseoverskrift</Text>
          <TextInput
            style={[styles.fieldInput, { color: Colors[colorScheme].text }]}
            value={title}
            onChangeText={setTitle}
            placeholder=""
            placeholderTextColor={Colors[colorScheme].textMuted}
          />
        </View>

        {/* Description (Beskrivelse) */}
        <View style={[styles.field, { borderColor: Colors[colorScheme].border }]}>
          <Text style={[styles.fieldLabel, { color: Colors[colorScheme].textMuted }]}>Beskrivelse</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextArea, { color: Colors[colorScheme].text }]}
            value={description}
            onChangeText={setDescription}
            placeholder=""
            placeholderTextColor={Colors[colorScheme].textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Price (Pris) */}
        <View style={[styles.field, { borderColor: Colors[colorScheme].border }]}>
          <Text style={[styles.fieldLabel, { color: Colors[colorScheme].textMuted }]}>Pris</Text>
          <TextInput
            style={[styles.fieldInput, { color: Colors[colorScheme].text }]}
            value={price}
            onChangeText={setPrice}
            placeholder=""
            placeholderTextColor={Colors[colorScheme].textMuted}
            keyboardType="numeric"
          />
        </View>

        {/* Location section */}
        <View style={[styles.section, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }]}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].textMuted }]}>Adresse</Text>
          <View style={styles.postalRow}>
            <View style={styles.postalCodeBox}>
              <Text style={[styles.postalLabel, { color: Colors[colorScheme].textMuted }]}>Postnummer</Text>
              <TextInput
                ref={postalRef}
                style={[styles.postalInput, { color: Colors[colorScheme].text }]}
                value={postalCode}
                onChangeText={handlePostalCodeChange}
                placeholder="Postnummer"
                placeholderTextColor={Colors[colorScheme].textMuted}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.cityBox,
                {
                  borderColor: Colors[colorScheme].border,
                  backgroundColor: city ? 'transparent' : Colors[colorScheme].input,
                },
              ]}
            >
              <Text style={[styles.postalLabel, { color: Colors[colorScheme].textMuted }]}>Poststed</Text>
              <View style={styles.cityRow}>
              {lookingUpPostal ? (
                <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
              ) : (
                <Text
                  style={[
                    styles.cityText,
                    city && city.length > 16 ? styles.cityTextSmall : null,
                    { color: city ? Colors[colorScheme].tint : Colors[colorScheme].textMuted },
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {city || 'Poststed'}
                </Text>
              )}
              <FontAwesome name="lock" size={14} color={Colors[colorScheme].textMuted} style={styles.lockIcon} />
              </View>
            </View>
          </View>
        </View>

        {/* Limited profile toggle */}
        <View style={[styles.section, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleLabel, { color: Colors[colorScheme].text }]}>Begrenset profil</Text>
              <Text style={[styles.toggleDescription, { color: Colors[colorScheme].textMuted }]}>
                Ikke vis profilbilde eller lenke til profilsiden før kjøperen tar kontakt med meg
              </Text>
            </View>
            <Switch
              value={limitedProfile}
              onValueChange={setLimitedProfile}
              trackColor={{ false: Colors[colorScheme].border, true: Colors[colorScheme].tint }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Validation message */}
        {getValidationMessage() && (
          <View style={styles.validationMessage}>
            <Text style={[styles.validationText, { color: Colors[colorScheme].textMuted }]}>
              {getValidationMessage()}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.previewButton, { borderColor: Colors[colorScheme].border }]}>
            <Text style={[styles.previewButtonText, { color: Colors[colorScheme].tint }]}>Se forhåndsvisning</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextButton, { backgroundColor: validateForm().length === 0 ? Colors[colorScheme].tint : Colors[colorScheme].card }]}
            onPress={handlePost}
            disabled={isSubmitting || validateForm().length > 0}
          >
            <Text style={[styles.nextButtonText, { color: validateForm().length === 0 ? '#FFFFFF' : Colors[colorScheme].textMuted }]}>
              {isSubmitting ? 'Publiserer...' : 'Neste'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: Colors[colorScheme].border }]}>
            <TouchableOpacity onPress={() => setCategoryPickerVisible(false)}>
              <Text style={[styles.modalClose, { color: Colors[colorScheme].tint }]}>Lukk</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>Velg kategori</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.categoryList}>
            {Object.entries(JobCategories).map(([key, label]) => {
              if (key === 'all') return null;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.categoryItem, { borderBottomColor: Colors[colorScheme].border }]}
                  onPress={() => {
                    setCategory(key);
                    setCategoryPickerVisible(false);
                  }}
                >
                  <Text style={[styles.categoryItemText, { color: Colors[colorScheme].text }]}>
                    {label}
                  </Text>
                  {category === key && (
                    <FontAwesome name="check" size={20} color={Colors[colorScheme].tint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  closeButton: {
    fontSize: 17,
    fontWeight: '400',
  },
  myJobsButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 20,
  },
  imageSection: {
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  imageGallery: {
    flexDirection: 'row',
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryImageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryImageText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  addMoreButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addMoreText: {
    fontSize: 13,
    fontWeight: '400',
  },
  imageUploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  imageButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  imageButtonLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 12,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  typeButtonInner: {
    width: '100%',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  field: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
  },
  fieldValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldValue: {
    fontSize: 17,
    fontWeight: '400',
  },
  fieldInput: {
    fontSize: 17,
    fontWeight: '400',
    padding: 0,
  },
  fieldTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 17,
    fontWeight: '400',
  },
  lockIcon: {
    marginLeft: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 6,
  },
  toggleDescription: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  postalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  postalCodeBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postalInput: {
    fontSize: 17,
    fontWeight: '400',
    padding: 0,
  },
  cityBox: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  cityText: {
    fontSize: 17,
    fontWeight: '400',
    flexShrink: 1,
    flex: 1,
    lineHeight: 22,
  },
  cityTextSmall: {
    fontSize: 15,
    lineHeight: 20,
  },
  postalLabel: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  validationMessage: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  validationText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  previewButton: {
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalClose: {
    fontSize: 17,
    fontWeight: '400',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  categoryList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryItemText: {
    fontSize: 17,
    fontWeight: '400',
  },
});