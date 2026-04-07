<template>
  <div class="auth-page">

    <div class="left-panel">
      <div class="brand">
        <div class="brand-logo"><span>📅</span></div>
        <h1 class="brand-name">Congés<span class="brand-pro">Pro</span></h1>
        <p class="brand-tagline">Créez un nouveau mot de passe<br/>sécurisé pour votre compte.</p>
      </div>
      <div class="features">
        <div class="feature-item">
          <div class="feature-dot"></div>
          <div>
            <div class="feature-title">Minimum 6 caractères</div>
            <div class="feature-desc">Utilisez un mélange de lettres, chiffres et symboles</div>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-dot"></div>
          <div>
            <div class="feature-title">Unique</div>
            <div class="feature-desc">N'utilisez pas le même mot de passe qu'ailleurs</div>
          </div>
        </div>
      </div>
      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>
    </div>

    <div class="right-panel">
      <div class="form-card">
        <div class="form-header">
          <div class="form-badge">Réinitialisation</div>
          <h2 class="form-title">Nouveau mot de passe 🔑</h2>
          <p class="form-sub">Choisissez un mot de passe sécurisé</p>
        </div>

        <div class="form-body">
          <!-- Nouveau mot de passe -->
          <div class="field">
            <label class="field-label">Nouveau mot de passe</label>
            <div class="input-wrap" :class="{ focused: focus1 }">
              <span class="input-icon">🔒</span>
              <input
                v-model="motDePasse"
                :type="showPass ? 'text' : 'password'"
                placeholder="Minimum 6 caractères"
                class="field-input"
                @focus="focus1 = true"
                @blur="focus1 = false"
              />
              <button type="button" class="toggle-pass" @click="showPass = !showPass">
                {{ showPass ? '🙈' : '👁️' }}
              </button>
            </div>
            <!-- Jauge de force -->
            <div class="strength-bar" v-if="motDePasse">
              <div class="strength-fill" :style="{ width: strengthPct + '%', background: strengthColor }"></div>
            </div>
            <div class="strength-label" v-if="motDePasse">
              <span :style="{ color: strengthColor }">{{ strengthLabel }}</span>
            </div>
          </div>

          <!-- Confirmation -->
          <div class="field">
            <label class="field-label">Confirmer le mot de passe</label>
            <div class="input-wrap" :class="{ focused: focus2, error: motDePasse && confirmation && motDePasse !== confirmation }">
              <span class="input-icon">🔒</span>
              <input
                v-model="confirmation"
                :type="showPass ? 'text' : 'password'"
                placeholder="Retapez le mot de passe"
                class="field-input"
                @focus="focus2 = true"
                @blur="focus2 = false"
                @keyup.enter="submit"
              />
            </div>
            <div class="match-hint" v-if="confirmation && motDePasse !== confirmation">
              <span style="color:#f87171;font-size:12px;">⚠️ Les mots de passe ne correspondent pas</span>
            </div>
            <div class="match-hint" v-if="confirmation && motDePasse === confirmation && motDePasse.length >= 6">
              <span style="color:#4ade80;font-size:12px;">✅ Les mots de passe correspondent</span>
            </div>
          </div>

          <transition name="fade">
            <div class="alert alert-success" v-if="message">✅ {{ message }}</div>
          </transition>
          <transition name="fade">
            <div class="alert alert-error" v-if="erreur">⚠️ {{ erreur }}</div>
          </transition>

          <button
            class="submit-btn"
            @click="submit"
            :disabled="loading || !canSubmit"
            :class="{ loading }"
          >
            <span v-if="!loading">🔐 Réinitialiser</span>
            <span v-else class="btn-spinner"></span>
          </button>

          <p class="back-link">
            <router-link to="/" class="back-a">← Retour à la connexion</router-link>
          </p>
        </div>
      </div>

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
  name: 'ResetPassword',
  data() {
    return {
      motDePasse: '',
      confirmation: '',
      message: '',
      erreur: '',
      loading: false,
      showPass: false,
      focus1: false,
      focus2: false,
    };
  },
  computed: {
    canSubmit() {
      return this.motDePasse.length >= 6 && this.motDePasse === this.confirmation;
    },
    strengthPct() {
      const p = this.motDePasse;
      if (!p) return 0;
      let score = 0;
      if (p.length >= 6) score += 25;
      if (p.length >= 10) score += 25;
      if (/[A-Z]/.test(p)) score += 25;
      if (/[0-9!@#$%^&*]/.test(p)) score += 25;
      return score;
    },
    strengthColor() {
      const p = this.strengthPct;
      if (p <= 25) return '#f87171';
      if (p <= 50) return '#fb923c';
      if (p <= 75) return '#facc15';
      return '#4ade80';
    },
    strengthLabel() {
      const p = this.strengthPct;
      if (p <= 25) return 'Faible';
      if (p <= 50) return 'Moyen';
      if (p <= 75) return 'Bon';
      return 'Excellent';
    },
  },
  methods: {
    async submit() {
      this.message = '';
      this.erreur = '';
      if (!this.canSubmit) return;

      this.loading = true;
      try {
        const token = this.$route.params.token;
        const res = await axios.post(`/auth/reset-password/${token}`, {
          motDePasse: this.motDePasse
        });
        this.message = res.data.message;
        this.motDePasse = '';
        this.confirmation = '';

        // Rediriger vers login après 3s
        setTimeout(() => { this.$router.push('/'); }, 3000);
      } catch (err) {
        this.erreur = err.response?.data?.message || 'Erreur lors de la réinitialisation.';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.auth-page { font-family:'Sora',sans-serif; display:flex; min-height:100vh; background:#0a0f1e; }

.left-panel { flex:1; background:linear-gradient(160deg,#0f172a 0%,#1e1b4b 60%,#0a0f1e 100%); border-right:1px solid #1e293b; padding:48px 52px; display:flex; flex-direction:column; justify-content:center; gap:40px; position:relative; overflow:hidden; }
.brand { z-index:1; }
.brand-logo { width:64px; height:64px; background:linear-gradient(135deg,#4f46e5,#7c3aed); border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:24px; box-shadow:0 8px 32px rgba(79,70,229,.35); }
.brand-name { font-size:32px; font-weight:800; color:#f8fafc; letter-spacing:-.03em; margin:0 0 12px; }
.brand-pro { color:#818cf8; }
.brand-tagline { font-size:16px; color:#64748b; line-height:1.7; margin:0; }

.features { display:flex; flex-direction:column; gap:22px; z-index:1; }
.feature-item { display:flex; align-items:flex-start; gap:14px; }
.feature-dot { width:8px; height:8px; border-radius:50%; background:#4f46e5; flex-shrink:0; margin-top:5px; box-shadow:0 0 10px rgba(79,70,229,.6); }
.feature-title { font-size:14px; font-weight:700; color:#e2e8f0; margin-bottom:3px; }
.feature-desc { font-size:12px; color:#475569; line-height:1.5; }

.deco-circle { position:absolute; border-radius:50%; pointer-events:none; }
.deco-1 { width:320px; height:320px; border:1px solid rgba(79,70,229,.1); bottom:-80px; right:-80px; }
.deco-2 { width:200px; height:200px; border:1px solid rgba(79,70,229,.06); bottom:-20px; right:-20px; }

.right-panel { flex:0 0 480px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 40px; gap:24px; }

.form-card { width:100%; max-width:400px; background:#111827; border:1px solid #1e293b; border-radius:24px; overflow:hidden; animation:slideUp .5s cubic-bezier(.34,1.56,.64,1); }
@keyframes slideUp { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }

.form-header { padding:32px 32px 24px; border-bottom:1px solid #1e293b; }
.form-badge { display:inline-block; background:rgba(79,70,229,.15); color:#a5b4fc; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; padding:4px 14px; border-radius:99px; border:1px solid rgba(79,70,229,.2); margin-bottom:16px; }
.form-title { font-size:24px; font-weight:800; color:#f8fafc; letter-spacing:-.02em; margin:0 0 8px; }
.form-sub { font-size:13px; color:#475569; margin:0; }

.form-body { padding:28px 32px 32px; display:flex; flex-direction:column; gap:20px; }

.field { display:flex; flex-direction:column; gap:8px; }
.field-label { font-size:12px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }
.input-wrap { display:flex; align-items:center; gap:10px; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:13px 16px; transition:border-color .2s, box-shadow .2s; }
.input-wrap.focused { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.15); }
.input-wrap.error { border-color:rgba(248,113,113,.5); box-shadow:0 0 0 3px rgba(248,113,113,.1); }
.input-icon { font-size:16px; flex-shrink:0; }
.field-input { background:none; border:none; outline:none; font-size:14px; font-family:'Sora',sans-serif; color:#e2e8f0; flex:1; }
.field-input::placeholder { color:#475569; }
.toggle-pass { background:none; border:none; cursor:pointer; font-size:16px; padding:0; opacity:.6; transition:opacity .2s; }
.toggle-pass:hover { opacity:1; }

.strength-bar { height:3px; background:#1e293b; border-radius:99px; overflow:hidden; margin-top:6px; }
.strength-fill { height:100%; border-radius:99px; transition:width .4s ease, background .4s; }
.strength-label { font-size:11px; font-weight:600; margin-top:4px; }
.match-hint { margin-top:4px; }

.alert { border-radius:10px; padding:11px 14px; font-size:13px; font-weight:500; }
.alert-success { background:rgba(74,222,128,.1); color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.alert-error { background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.2); }

.submit-btn { width:100%; padding:15px; background:linear-gradient(135deg,#4f46e5,#7c3aed); border:none; border-radius:12px; color:white; font-size:15px; font-weight:700; font-family:'Sora',sans-serif; cursor:pointer; transition:opacity .2s, transform .15s; display:flex; align-items:center; justify-content:center; }
.submit-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
.submit-btn:disabled { opacity:.35; cursor:not-allowed; }
.btn-spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }

.back-link { text-align:center; font-size:13px; margin:0; }
.back-a { color:#818cf8; font-weight:700; text-decoration:none; }
.back-a:hover { color:#a5b4fc; text-decoration:underline; }

.right-footer { display:flex; align-items:center; gap:8px; font-size:12px; color:#334155; }
.dot-sep { color:#1e293b; }

.fade-enter-active,.fade-leave-active { transition:opacity .3s; }
.fade-enter-from,.fade-leave-to { opacity:0; }

@media (max-width:900px) { .auth-page{flex-direction:column;} .left-panel{padding:36px 28px;min-height:240px;} .right-panel{flex:1;padding:32px 20px;} .deco-circle{display:none;} }
@media (max-width:480px) { .right-panel{padding:24px 16px;} .form-header{padding:24px 20px 20px;} .form-body{padding:20px 20px 24px;} }
</style>