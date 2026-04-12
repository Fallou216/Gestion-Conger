import { createRouter, createWebHistory } from 'vue-router';

// Layout
import AppLayout from '../components/AppLayout.vue';

// Vues publiques
import Login          from '../views/Login.vue';
import Register       from '../views/Register.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import ResetPassword  from '../views/ResetPassword.vue';

// Vues employé
import DashboardEmploye  from '../views/DashboardEmploye.vue';
import MesDemandes       from '../views/MesDemandes.vue';
import SoumettreDemande  from '../views/SoumettreDemande.vue';

// Vues responsable + admin (partagées)
import DashboardResponsable from '../views/DashboardResponsable.vue';
import DashboardAdmin       from '../views/DashboardAdmin.vue';
import Services             from '../views/Services.vue';
import Utilisateurs         from '../views/Utilisateurs.vue';

// Vue partagée
import Calendrier from '../views/Calendrier.vue';
import Profil from '../views/Profil.vue';

// ── Vérifier si le token JWT est expiré ──
function isTokenValid() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    // Décoder le payload du JWT (partie entre les 2 points)
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Vérifier l'expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Token expiré — nettoyer
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('nom');
      localStorage.removeItem('prenom');
      return false;
    }
    return true;
  } catch {
    // Token malformé — nettoyer
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('nom');
    localStorage.removeItem('prenom');
    return false;
  }
}

const routes = [

  // ── PUBLIQUES ─────────────────────────────────────
  { path: '/',                      name: 'Login',          component: Login },
  { path: '/register',              name: 'Register',       component: Register },
  { path: '/forgot-password',       name: 'ForgotPassword', component: ForgotPassword },
  { path: '/reset-password/:token', name: 'ResetPassword',  component: ResetPassword },

  // ── ADMIN ─────────────────────────────────────────
  {
    path: '/admin',
    component: AppLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '',            redirect: '/admin/dashboard' },
      { path: 'dashboard',   name: 'DashboardAdmin',      component: DashboardAdmin },
      { path: 'utilisateurs', name: 'AdminUtilisateurs',   component: Utilisateurs },
      { path: 'services',    name: 'AdminServices',        component: Services },
      { path: 'demandes',    name: 'AdminDemandes',        component: DashboardResponsable },
      { path: 'calendrier',  name: 'CalendrierAdmin',      component: Calendrier },
      { path: 'profil',      name: 'ProfilAdmin',          component: Profil },
    ]
  },

  // ── RESPONSABLE ───────────────────────────────────
  {
    path: '/responsable',
    component: AppLayout,
    meta: { requiresAuth: true, role: 'responsable' },
    children: [
      { path: '',           redirect: '/responsable/demandes' },
      { path: 'demandes',   name: 'DashboardResponsable', component: DashboardResponsable },
      { path: 'calendrier', name: 'CalendrierResponsable', component: Calendrier },
      { path: 'profil',     name: 'ProfilResponsable',    component: Profil },
    ]
  },

  // ── EMPLOYÉ ───────────────────────────────────────
  {
    path: '/employe',
    component: AppLayout,
    meta: { requiresAuth: true, role: 'employe' },
    children: [
      { path: '',             redirect: '/employe/dashboard' },
      { path: 'dashboard',    name: 'DashboardEmploye',   component: DashboardEmploye },
      { path: 'mes-demandes', name: 'MesDemandes',        component: MesDemandes },
      { path: 'soumettre',    name: 'SoumettreDemande',   component: SoumettreDemande },
      { path: 'calendrier',   name: 'CalendrierEmploye',  component: Calendrier },
      { path: 'profil',       name: 'ProfilEmploye',     component: Profil },
    ]
  },

  // ── FALLBACK ──────────────────────────────────────
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// ── GUARD GLOBAL ────────────────────────────────────
router.beforeEach((to, from, next) => {
  const tokenValid = isTokenValid();
  const role = localStorage.getItem('role');

  const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
  const requiredRole = to.matched.find(r => r.meta.role)?.meta.role;

  if (requiresAuth) {
    // Pas de token ou token expiré → Login
    if (!tokenValid) return next({ name: 'Login' });

    // Mauvais rôle → rediriger vers le bon dashboard
    if (requiredRole && requiredRole !== role) {
      if (role === 'admin')       return next({ name: 'DashboardAdmin' });
      if (role === 'employe')     return next({ name: 'DashboardEmploye' });
      if (role === 'responsable') return next({ name: 'DashboardResponsable' });
      return next({ name: 'Login' });
    }
  } else {
    // Si déjà connecté avec un token valide et sur Login/Register → rediriger
    if ((to.name === 'Login' || to.name === 'Register') && tokenValid) {
      if (role === 'admin')       return next({ name: 'DashboardAdmin' });
      if (role === 'employe')     return next({ name: 'DashboardEmploye' });
      if (role === 'responsable') return next({ name: 'DashboardResponsable' });
    }
  }

  next();
});

export default router;