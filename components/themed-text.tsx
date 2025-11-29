import { Text as DefaultText } from 'react-native';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Typography';
import { useColorScheme } from '../hooks/use-color-scheme';

export type TextProps = DefaultText['props'];

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  const colorScheme = useColorScheme();

  return (
    <DefaultText
      style={[
        { 
          color: Colors[colorScheme].text,
          fontFamily: FontFamily.regular,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}