import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface PickedPhoto {
  uri: string;
  base64: string;
  mediaType: 'image/jpeg';
}

/** Abre câmera ou galeria e devolve a foto reduzida (lado maior ≤ 1280 px) em JPEG base64. */
export async function pickMealPhoto(source: 'camera' | 'galeria'): Promise<PickedPhoto | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Permita o acesso à câmera para fotografar o prato.');
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.8 };
  const res =
    source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets[0]) return null;

  const asset = res.assets[0];
  const ctx = ImageManipulator.manipulate(asset.uri);
  const landscape = (asset.width ?? 0) >= (asset.height ?? 0);
  ctx.resize(landscape ? { width: 1280 } : { height: 1280 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!out.base64) throw new Error('Não foi possível processar a foto.');
  return { uri: out.uri, base64: out.base64.replace(/^data:image\/\w+;base64,/, ''), mediaType: 'image/jpeg' };
}
