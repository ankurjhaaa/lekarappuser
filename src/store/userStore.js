import { create } from 'zustand';
import { userAPI } from '../api/user';

const useUserStore = create((set, get) => ({
  savedPlaces: [],
  searchHistory: [],
  loading: false,

  fetchSavedPlaces: async () => {
    try {
      set({ loading: true });
      const res = await userAPI.getSavedPlaces();
      if (res.data.success) {
        set({ savedPlaces: res.data.places });
      }
    } catch (e) {
      console.error('Fetch saved places error:', e);
    } finally {
      set({ loading: false });
    }
  },

  fetchSearchHistory: async () => {
    try {
      const res = await userAPI.getSearchHistory();
      if (res.data.success) {
        set({ searchHistory: res.data.history });
      }
    } catch (e) {
      console.error('Fetch search history error:', e);
    }
  },

  addSavedPlace: async (data) => {
    try {
      const res = await userAPI.addSavedPlace(data);
      if (res.data.success) {
        set((state) => ({ savedPlaces: [res.data.place, ...state.savedPlaces] }));
        return res.data.place;
      }
    } catch (e) {
      console.error('Add saved place error:', e);
      throw e;
    }
  },

  deleteSavedPlace: async (id) => {
    try {
      const res = await userAPI.deleteSavedPlace(id);
      if (res.data.success) {
        set((state) => ({ savedPlaces: state.savedPlaces.filter((p) => p.id !== id) }));
      }
    } catch (e) {
      console.error('Delete saved place error:', e);
    }
  },

  addToHistory: async (data) => {
    try {
      const res = await userAPI.addSearchHistory(data);
      if (res.data.success) {
        const newHistory = [res.data.history, ...get().searchHistory.filter(h => h.address !== data.address)].slice(0, 10);
        set({ searchHistory: newHistory });
      }
    } catch (e) {
      console.error('Add to history error:', e);
    }
  },

  deleteHistory: async (id) => {
    try {
      const res = await userAPI.deleteSearchHistory(id);
      if (res.data.success) {
        set((state) => ({ searchHistory: state.searchHistory.filter((h) => h.id !== id) }));
      }
    } catch (e) {
      console.error('Delete history error:', e);
    }
  }
}));

export default useUserStore;
