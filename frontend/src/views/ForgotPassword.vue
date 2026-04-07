<template>
  <div class="auth-page">

    <div class="left-panel">
      <div class="brand">
        <div class="brand-logo"><span>📅</span></div>
        <h1 class="brand-name">Congés<span class="brand-pro">Pro</span></h1>
        <p class="brand-tagline">Réinitialisez votre mot de passe<br/>en toute sécurité.</p>
      </div>
      <div class="features">
        <div class="feature-item">
          <div class="feature-dot"></div>
          <div>
            <div class="feature-title">Sécurisé</div>
            <div class="feature-desc">Un lien unique vous sera envoyé par email</div>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-dot"></div>
          <div>
            <div class="feature-title">Rapide</div>
            <div class="feature-desc">Réinitialisez en moins d'une minute</div>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-dot"></div>
          <div>
            <div class="feature-title">Expire automatiquement</div>
            <div class="feature-desc">Le lien est valable 1 heure</div>
          </div>
        </div>
      </div>
      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>
    </div>

    <div class="right-panel">
      <div class="form-card">
        <div class="form-header">
          <div class="form-badge">Récupération</div>
          <h2 class="form-title">Mot de passe oublié 🔒</h2>
          <p class="form-sub">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <div class="form-body">
          <div class="field">
            <label class="field-label">Adresse email</label>
            <div class="input-wrap" :class="{ focused: focusEmail }">
              <span class="input-icon">✉️</span>
              <input
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                class="field-input"
                @focus="focusEmail = true"
                @blur="focusEmail = false"
                @keyup.enter="submit"
              />
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
            :disabled="loading || !email"
            :class="{ loading }"
          >
            <span v-if="!loading">📧 Envoyer le lien</span>
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
  name: 'ForgotPassword',
  data() {
    return {
      email: '',
      message: '',
      erreur: '',
      loading: false,
      focusEmail: false,
    };
  },
  methods: {
    async submit() {
      this.message = '';
      this.erreur = '';
      if (!this.email) return;

      this.loading = true;
      try {
        const res = await axios.post('/auth/forgot-password', { email: this.email });
        this.message = res.data.message;
        this.email = '';
      } catch (err) {
        this.erreur = err.response?.data?.message || 'Erreur lors de l\'envoi.';
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
.input-icon { font-size:16px; flex-shrink:0; }
.field-input { background:none; border:none; outline:none; font-size:14px; font-family:'Sora',sans-serif; color:#e2e8f0; flex:1; }
.field-input::placeholder { color:#475569; }

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