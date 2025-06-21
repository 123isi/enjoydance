import { create } from 'zustand';

type YoutubeImageStore = {
  imageMap: Record<string, string>;
  setImage: (key: string, url: string) => void;
};

export const useYoutubeImageStore = create<YoutubeImageStore>((set) => ({
  imageMap: {},
  setImage: (key, url) =>
    set((state) => ({
      imageMap: {
        ...state.imageMap,
        [key]: url,
      },
    })),
}));
