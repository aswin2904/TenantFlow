import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  organizations: [],
  activeOrgId: localStorage.getItem('activeOrgId') || null,
  currentRole: null,
  loading: true,

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/auth/me');
      const defaultOrg =
        localStorage.getItem('activeOrgId') ||
        data.user.activeOrganization ||
        data.organizations[0]?._id ||
        null;

      if (defaultOrg) localStorage.setItem('activeOrgId', defaultOrg);

      const activeOrgObj = data.organizations.find((o) => o._id === defaultOrg);
      const memberObj = activeOrgObj?.members.find((m) => m.user === data.user._id);

      set({
        user: data.user,
        organizations: data.organizations,
        activeOrgId: defaultOrg,
        currentRole: memberObj?.role || null,
        loading: false,
      });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('activeOrgId');
      set({ user: null, organizations: [], activeOrgId: null, currentRole: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    if (data.activeOrganization) {
      localStorage.setItem('activeOrgId', data.activeOrganization);
    }
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
  },

  switchOrganization: async (orgId) => {
    await api.patch(`/orgs/${orgId}/switch`);
    localStorage.setItem('activeOrgId', orgId);
    window.location.reload();
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('activeOrgId');
    set({ user: null, organizations: [], activeOrgId: null, currentRole: null });
  },
}));

export default useAuthStore;
