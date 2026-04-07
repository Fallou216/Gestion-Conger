<template>
  <div class="login-page">

    <!-- PANNEAU GAUCHE — Branding -->
    <div class="left-panel">
      <div class="brand">
        <div class="brand-logo">
          <span class="logo-icon">📅</span>
        </div>
        <h1 class="brand-name">CongesPro</h1>
        <p class="brand-tagline">Gérez vos congés simplement,<br/>efficacement, en toute transparence.</p>
      </div>

      <div class="features">
        <div class="feature-item" v-for="f in features" :key="f.title">
          <div class="feature-dot"></div>
          <div>
            <div class="feature-title">{{ f.title }}</div>
            <div class="feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>

      <div class="left-footer">
        <div class="stat-row">
          <div class="stat" v-for="s in stats" :key="s.label">
            <div class="stat-val">{{ s.val }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Décor géométrique -->
      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>
    </div>

    <!-- PANNEAU DROIT — Formulaire -->
    <div class="right-panel">
      <div class="form-card">

        <div class="form-header">
          <div class="form-badge">Connexion</div>
          <h2 class="form-title">Bon retour 👋</h2>
          <p class="form-sub">Connectez-vous à votre espace de gestion</p>
        </div>

        <div class="form-body">

          <!-- Email -->
          <div class="field">
            <label class="field-label">Adresse email</label>
            <div class="input-wrap" :class="{ focused: focusEmail, error: erreur && !loading }">
              <span class="input-icon">✉️</span>
              <input
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                class="field-input"
                autocomplete="email"
                @focus="focusEmail = true"
                @blur="focusEmail = false"
                @keyup.enter="login"
              />
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="field">
            <div class="field-top">
              <label class="field-label">Mot de passe</label>
            </div>
            <div class="input-wrap" :class="{ focused: focusMdp, error: erreur && !loading }">
              <span class="input-icon">🔒</span>
              <input
                v-model="motDePasse"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••"
                class="field-input"
                autocomplete="current-password"
                @focus="focusMdp = true"
                @blur="focusMdp = false"
                @keyup.enter="login"
              />
              <button type="button" class="toggle-pass" @click="showPass = !showPass">
                {{ showPass ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <!-- Erreur -->
          <transition name="shake">
            <div class="alert-error" v-if="erreur">
              <span>⚠️</span>
              <span>{{ erreur }}</span>
            </div>
          </transition>

          <!-- Bouton -->
          <button
            class="submit-btn"
            @click="login"
            :disabled="loading || !email || !motDePasse"
            :class="{ loading }"
          >
            <span v-if="!loading">Se connecter →</span>
            <span v-else class="btn-spinner"></span>
          </button>

          <!-- Lien inscription -->
          <p class="register-link">
            Pas encore de compte ?
            <router-link to="/register" class="register-a">Créer un compte</router-link>
          </p>

          <p class="forgot-link">
            <router-link to="/forgot-password" class="forgot-a">Mot de passe oublié ?</router-link>
          </p>

        </div>
      </div>

      <!-- Footer -->
      <div class="right-footer">
        <span>© 2026 CongesPro</span>
        <span class="dot-sep">·</span>
        <span>Tous droits réservés</span>
      </div>
    </div>

  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      motDePasse: '',
      erreur: '',
      loading: false,
      showPass: false,
      focusEmail: false,
      focusMdp: false,
      features: [
        { title: 'Suivi en temps réel', desc: 'Statut de vos demandes mis à jour instantanément' },
        { title: 'Validation simplifiée', desc: 'Approbation ou refus en un seul clic' },
        { title: 'Statistiques claires', desc: 'Tableaux de bord visuels et intuitifs' },
      ],
      stats: [
        { val: '100%', label: 'Numérique' },
        { val: '2x', label: 'Plus rapide' },
        { val: '0', label: 'Papier' },
      ],
    };
  },
  methods: {
    async login() {
      this.erreur = '';
      if (!this.email || !this.motDePasse) return;
      this.loading = true;
      try {
        const res = await axios.post('/auth/login', {
          email: this.email,
          motDePasse: this.motDePasse
        });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        if (user.nom)    localStorage.setItem('nom', user.nom);
        if (user.prenom) localStorage.setItem('prenom', user.prenom);

        if (user.role === 'employe') {
          this.$router.push('/employe/dashboard');
        } else if (user.role === 'responsable') {
          this.$router.push('/responsable/demandes');
        }
      } catch (err) {
        this.erreur = err.response?.data?.message || 'Email ou mot de passe incorrect.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

/* ── PAGE ── */
.login-page {
  font-family: 'Sora', sans-serif;
  display: flex;
  min-height: 100vh;
  background: #0a0f1e;
}

/* ── PANNEAU GAUCHE ── */
.left-panel {
  flex: 1;
  background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0a0f1e 100%);
  border-right: 1px solid #1e293b;
  padding: 48px 52px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.brand { z-index: 1; }
.brand-logo {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(79,70,229,.35);
}
.brand-name {
  font-size: 32px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: -.03em;
  margin: 0 0 12px;
}
.brand-tagline {
  font-size: 16px;
  color: #64748b;
  line-height: 1.7;
  margin: 0;
}

.features { display: flex; flex-direction: column; gap: 22px; z-index: 1; }
.feature-item { display: flex; align-items: flex-start; gap: 14px; }
.feature-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4f46e5;
  flex-shrink: 0;
  margin-top: 5px;
  box-shadow: 0 0 10px rgba(79,70,229,.6);
}
.feature-title { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 3px; }
.feature-desc  { font-size: 12px; color: #475569; line-height: 1.5; }

.stat-row { display: flex; gap: 32px; z-index: 1; }
.stat-val   { font-size: 26px; font-weight: 800; color: #f8fafc; letter-spacing: -.02em; }
.stat-label { font-size: 11px; color: #475569; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; margin-top: 3px; }

/* Décors géométriques */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.deco-1 {
  width: 320px; height: 320px;
  border: 1px solid rgba(79,70,229,.1);
  bottom: -80px; right: -80px;
}
.deco-2 {
  width: 200px; height: 200px;
  border: 1px solid rgba(79,70,229,.06);
  bottom: -20px; right: -20px;
}

/* ── PANNEAU DROIT ── */
.right-panel {
  flex: 0 0 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  gap: 24px;
}

.form-card {
  width: 100%;
  max-width: 400px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 24px;
  overflow: hidden;
  animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

.form-header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid #1e293b;
}
.form-badge {
  display: inline-block;
  background: rgba(79,70,229,.15);
  color: #a5b4fc;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  padding: 4px 14px;
  border-radius: 99px;
  border: 1px solid rgba(79,70,229,.2);
  margin-bottom: 16px;
}
.form-title {
  font-size: 24px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: -.02em;
  margin: 0 0 8px;
}
.form-sub { font-size: 13px; color: #475569; margin: 0; }

.form-body { padding: 28px 32px 32px; display: flex; flex-direction: column; gap: 20px; }

.field { display: flex; flex-direction: column; gap: 8px; }
.field-top { display: flex; align-items: center; justify-content: space-between; }
.field-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; }

.input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 13px 16px;
  transition: border-color .2s, box-shadow .2s;
}
.input-wrap.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }
.input-wrap.error   { border-color: rgba(248,113,113,.5); box-shadow: 0 0 0 3px rgba(248,113,113,.1); }
.input-icon { font-size: 16px; flex-shrink: 0; }
.field-input {
  background: none; border: none; outline: none;
  font-size: 14px; font-family: 'Sora', sans-serif;
  color: #e2e8f0; flex: 1;
}
.field-input::placeholder { color: #475569; }
.toggle-pass {
  background: none; border: none; cursor: pointer;
  font-size: 16px; padding: 0; line-height: 1;
  opacity: .6; transition: opacity .2s;
}
.toggle-pass:hover { opacity: 1; }

.alert-error {
  display: flex; align-items: center; gap: 8px;
  background: rgba(248,113,113,.1);
  border: 1px solid rgba(248,113,113,.2);
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 13px;
  color: #f87171;
  font-weight: 500;
}

.submit-btn {
  width: 100%; padding: 15px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: none; border-radius: 12px;
  color: white; font-size: 15px; font-weight: 700;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  transition: opacity .2s, transform .15s;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: .01em;
}
.submit-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: .35; cursor: not-allowed; }
.btn-spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.register-link { text-align: center; font-size: 13px; color: #475569; margin: 0; }
.register-a { color: #818cf8; font-weight: 700; text-decoration: none; transition: color .2s; }
.register-a:hover { color: #a5b4fc; text-decoration: underline; }

.forgot-link { text-align: center; font-size: 13px; color: #475569; margin: 0; }
.forgot-a { color: #64748b; font-weight: 600; text-decoration: none; transition: color .2s; }
.forgot-a:hover { color: #818cf8; text-decoration: underline; }

/* Footer */
.right-footer { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #334155; }
.dot-sep { color: #1e293b; }

/* Shake animation */
.shake-enter-active { animation: shake .4s ease; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .login-page  { flex-direction: column; }
  .left-panel  { padding: 36px 28px; min-height: 280px; }
  .right-panel { flex: 1; padding: 32px 20px; }
  .stat-row    { gap: 20px; }
  .deco-circle { display: none; }
}
@media (max-width: 480px) {
  .right-panel { padding: 24px 16px; }
  .form-header { padding: 24px 20px 20px; }
  .form-body   { padding: 20px 20px 24px; }
}
</style>