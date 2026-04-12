<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Mon compte</div>
        <h1 class="page-title">Mon profil</h1>
      </div>
    </div>

    <div class="profile-grid" v-if="user">

      <!-- COLONNE GAUCHE — Photo + Infos -->
      <div class="col-left">

        <!-- PHOTO -->
        <div class="card photo-card">
          <div class="photo-zone">
            <div class="photo-wrap" @click="$refs.photoInput.click()">
              <img v-if="photoUrl" :src="photoUrl" class="photo-img" alt="Photo" />
              <div v-else class="photo-placeholder">
                <span class="photo-initiales">{{ userInitiales }}</span>
              </div>
              <div class="photo-overlay">
                <span>📷</span>
              </div>
              <input type="file" ref="photoInput" @change="uploadPhoto" class="file-hidden"
                accept=".jpg,.jpeg,.png,.webp" />
            </div>
            <div class="photo-actions" v-if="user.photo">
              <button class="photo-del" @click="supprimerPhoto">🗑️ Supprimer la photo</button>
            </div>
            <div class="photo-hint">JPG, PNG ou WebP — Max 2 Mo</div>
          </div>

          <div class="user-info-zone">
            <h3 class="ui-name">{{ user.prenom }} {{ user.nom }}</h3>
            <span class="ui-role" :class="'role-' + user.role">
              {{ user.role === 'admin' ? '👑 Administrateur' : user.role === 'responsable' ? '👑 Responsable' : '👤 Employé' }}
            </span>
            <span class="ui-email">{{ user.email }}</span>
            <div class="ui-details" v-if="user.role === 'employe'">
              <div class="uid-row">
                <span class="uid-label">Solde congés</span>
                <span class="uid-val uid-solde">{{ user.soldeConges || 0 }}j</span>
              </div>
              <div class="uid-row" v-if="user.service">
                <span class="uid-label">Service</span>
                <span class="uid-val">{{ user.service.nom }}</span>
              </div>
              <div class="uid-row" v-if="user.createdAt">
                <span class="uid-label">Membre depuis</span>
                <span class="uid-val">{{ formatDate(user.createdAt) }}</span>
              </div>
              <div class="uid-row">
                <span class="uid-label">Ancienneté</span>
                <span class="uid-val">{{ anciennete }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE — Formulaires -->
      <div class="col-right">

        <!-- MODIFIER INFOS -->
        <div class="card">
          <div class="card-hd">
            <span class="card-title">Informations personnelles</span>
            <span class="card-sub">Modifier</span>
          </div>
          <div class="form-body">
            <div class="form-grid">
              <div class="field-group">
                <label class="field-label">Prénom</label>
                <div class="input-wrap" :class="{ focused: focus.prenom }">
                  <span class="input-icon">👤</span>
                  <input v-model="form.prenom" type="text" class="field-input"
                    @focus="focus.prenom = true" @blur="focus.prenom = false" />
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Nom</label>
                <div class="input-wrap" :class="{ focused: focus.nom }">
                  <span class="input-icon">👤</span>
                  <input v-model="form.nom" type="text" class="field-input"
                    @focus="focus.nom = true" @blur="focus.nom = false" />
                </div>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Adresse email</label>
              <div class="input-wrap" :class="{ focused: focus.email }">
                <span class="input-icon">✉️</span>
                <input v-model="form.email" type="email" class="field-input"
                  @focus="focus.email = true" @blur="focus.email = false" />
              </div>
            </div>

            <transition name="fade">
              <div class="alert alert-success" v-if="msgInfos">✅ {{ msgInfos }}</div>
            </transition>
            <transition name="fade">
              <div class="alert alert-error" v-if="errInfos">⚠️ {{ errInfos }}</div>
            </transition>

            <button class="submit-btn" @click="sauvegarderInfos" :disabled="loadingInfos">
              <span v-if="!loadingInfos">💾 Enregistrer</span>
              <span v-else class="btn-spinner"></span>
            </button>
          </div>
        </div>

        <!-- CHANGER MOT DE PASSE -->
        <div class="card">
          <div class="card-hd">
            <span class="card-title">Changer le mot de passe</span>
            <span class="card-sub">Sécurité</span>
          </div>
          <div class="form-body">
            <div class="field-group">
              <label class="field-label">Mot de passe actuel</label>
              <div class="input-wrap" :class="{ focused: focus.ancien }">
                <span class="input-icon">🔒</span>
                <input v-model="formMdp.ancien" :type="showOld ? 'text' : 'password'"
                  placeholder="Votre mot de passe actuel" class="field-input"
                  @focus="focus.ancien = true" @blur="focus.ancien = false" />
                <button type="button" class="toggle-pass" @click="showOld = !showOld">{{ showOld ? '🙈' : '👁️' }}</button>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Nouveau mot de passe</label>
              <div class="input-wrap" :class="{ focused: focus.nouveau }">
                <span class="input-icon">🔐</span>
                <input v-model="formMdp.nouveau" :type="showNew ? 'text' : 'password'"
                  placeholder="Min. 6 caractères" class="field-input"
                  @focus="focus.nouveau = true" @blur="focus.nouveau = false" />
                <button type="button" class="toggle-pass" @click="showNew = !showNew">{{ showNew ? '🙈' : '👁️' }}</button>
              </div>
              <div class="strength-bar" v-if="formMdp.nouveau">
                <div class="strength-fill" :style="{ width: strengthPct + '%', background: strengthColor }"></div>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Confirmer</label>
              <div class="input-wrap" :class="{ focused: focus.confirm, error: formMdp.confirm && formMdp.nouveau !== formMdp.confirm }">
                <span class="input-icon">🔐</span>
                <input v-model="formMdp.confirm" :type="showNew ? 'text' : 'password'"
                  placeholder="Retapez le nouveau mot de passe" class="field-input"
                  @focus="focus.confirm = true" @blur="focus.confirm = false" />
              </div>
              <div v-if="formMdp.confirm && formMdp.nouveau !== formMdp.confirm" style="color:#f87171;font-size:12px;margin-top:4px;">
                ⚠️ Les mots de passe ne correspondent pas
              </div>
              <div v-if="formMdp.confirm && formMdp.nouveau === formMdp.confirm && formMdp.nouveau.length >= 6" style="color:#4ade80;font-size:12px;margin-top:4px;">
                ✅ Les mots de passe correspondent
              </div>
            </div>

            <transition name="fade">
              <div class="alert alert-success" v-if="msgMdp">✅ {{ msgMdp }}</div>
            </transition>
            <transition name="fade">
              <div class="alert alert-error" v-if="errMdp">⚠️ {{ errMdp }}</div>
            </transition>

            <button class="submit-btn" @click="changerMotDePasse"
              :disabled="loadingMdp || !formMdp.ancien || !formMdp.nouveau || formMdp.nouveau !== formMdp.confirm || formMdp.nouveau.length < 6">
              <span v-if="!loadingMdp">🔐 Changer le mot de passe</span>
              <span v-else class="btn-spinner"></span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- LOADER -->
    <div class="loader-wrap" v-if="!user">
      <div class="spinner"></div>
      <span>Chargement du profil…</span>
    </div>

    <!-- TOAST -->
    <transition name="toast">
      <div v-if="toast.visible" :class="['toast', `toast-${toast.type}`]">
        <span>{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        {{ toast.message }}
      </div>
    </transition>

  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'ProfilView',
  data() {
    return {
      user: null,
      form: { nom: '', prenom: '', email: '' },
      formMdp: { ancien: '', nouveau: '', confirm: '' },
      focus: { nom: false, prenom: false, email: false, ancien: false, nouveau: false, confirm: false },
      showOld: false, showNew: false,
      loadingInfos: false, loadingMdp: false,
      msgInfos: '', errInfos: '', msgMdp: '', errMdp: '',
      toast: { visible: false, message: '', type: 'success' },
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    };
  },

  computed: {
    userInitiales() {
      if (!this.user) return '??';
      const p = (this.user.prenom || '')[0] || '';
      const n = (this.user.nom || '')[0] || '';
      return (p + n).toUpperCase();
    },
    photoUrl() {
      if (!this.user || !this.user.photo) return null;
      return `${this.apiUrl}/uploads/photos/${this.user.photo}`;
    },
    anciennete() {
      if (!this.user || !this.user.createdAt) return '—';
      const ms = Date.now() - new Date(this.user.createdAt).getTime();
      const ans = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
      const mois = Math.floor((ms % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
      if (ans > 0) return `${ans} an${ans > 1 ? 's' : ''} et ${mois} mois`;
      return `${mois} mois`;
    },
    strengthPct() {
      const p = this.formMdp.nouveau;
      if (!p) return 0;
      let s = 0;
      if (p.length >= 6) s += 25;
      if (p.length >= 10) s += 25;
      if (/[A-Z]/.test(p)) s += 25;
      if (/[0-9!@#$%^&*]/.test(p)) s += 25;
      return s;
    },
    strengthColor() {
      const p = this.strengthPct;
      if (p <= 25) return '#f87171';
      if (p <= 50) return '#fb923c';
      if (p <= 75) return '#facc15';
      return '#4ade80';
    },
  },

  methods: {
    async chargerProfil() {
      try {
        const res = await axios.get('/profile');
        this.user = res.data;
        this.form.nom = this.user.nom;
        this.form.prenom = this.user.prenom;
        this.form.email = this.user.email;
      } catch {
        this.showToast('Erreur chargement profil', 'error');
      }
    },

    async sauvegarderInfos() {
      this.msgInfos = ''; this.errInfos = '';
      this.loadingInfos = true;
      try {
        const res = await axios.put('/profile', this.form);
        this.msgInfos = res.data.message;
        this.user = res.data.user;
        // Mettre à jour le localStorage
        localStorage.setItem('nom', this.user.nom);
        localStorage.setItem('prenom', this.user.prenom);
        this.showToast('Profil mis à jour', 'success');
      } catch (err) {
        this.errInfos = err.response?.data?.message || 'Erreur lors de la mise à jour.';
      } finally {
        this.loadingInfos = false;
        setTimeout(() => { this.msgInfos = ''; this.errInfos = ''; }, 5000);
      }
    },

    async changerMotDePasse() {
      this.msgMdp = ''; this.errMdp = '';
      this.loadingMdp = true;
      try {
        const res = await axios.put('/profile/password', {
          ancienMotDePasse: this.formMdp.ancien,
          nouveauMotDePasse: this.formMdp.nouveau,
        });
        this.msgMdp = res.data.message;
        this.formMdp = { ancien: '', nouveau: '', confirm: '' };
        this.showToast('Mot de passe modifié', 'success');
      } catch (err) {
        this.errMdp = err.response?.data?.message || 'Erreur lors du changement.';
      } finally {
        this.loadingMdp = false;
        setTimeout(() => { this.msgMdp = ''; this.errMdp = ''; }, 5000);
      }
    },

    async uploadPhoto(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('photo', file);
      try {
        const res = await axios.post('/profile/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.user.photo = res.data.photo;
        localStorage.setItem('photo', res.data.photo);
        this.showToast('Photo mise à jour', 'success');
      } catch (err) {
        this.showToast(err.response?.data?.message || 'Erreur upload photo', 'error');
      }
    },

    async supprimerPhoto() {
      try {
        await axios.delete('/profile/photo');
        this.user.photo = null;
        localStorage.removeItem('photo');
        this.showToast('Photo supprimée', 'success');
      } catch {
        this.showToast('Erreur suppression photo', 'error');
      }
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    },
    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type };
      setTimeout(() => { this.toast.visible = false; }, 3500);
    },
  },

  mounted() { this.chargerProfil(); },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.db { font-family:'Sora',sans-serif; background:#0a0f1e; min-height:100vh; padding:28px 32px 60px; color:#e2e8f0; }

.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; }
.breadcrumb { font-size:11px; color:#4a5568; letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:#f7fafc; letter-spacing:-.025em; margin:0; }

/* GRID */
.profile-grid { display:grid; grid-template-columns:340px 1fr; gap:24px; }

/* CARD */
.card { background:#111827; border:1px solid #1e293b; border-radius:20px; overflow:hidden; margin-bottom:24px; }
.card-hd { padding:20px 24px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; }
.card-title { font-size:15px; font-weight:700; color:#f1f5f9; }
.card-sub { font-size:12px; color:#475569; background:#1e293b; padding:3px 12px; border-radius:99px; font-weight:500; }

/* PHOTO */
.photo-zone { display:flex; flex-direction:column; align-items:center; padding:32px 24px 20px; }
.photo-wrap {
  width:120px; height:120px; border-radius:50%; position:relative; cursor:pointer;
  overflow:hidden; border:3px solid #1e293b; transition:border-color .2s;
}
.photo-wrap:hover { border-color:#4f46e5; }
.photo-img { width:100%; height:100%; object-fit:cover; }
.photo-placeholder {
  width:100%; height:100%;
  background:linear-gradient(135deg,#4f46e5,#7c3aed);
  display:flex; align-items:center; justify-content:center;
}
.photo-initiales { color:white; font-size:36px; font-weight:800; }
.photo-overlay {
  position:absolute; inset:0;
  background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center;
  font-size:28px; opacity:0; transition:opacity .2s;
}
.photo-wrap:hover .photo-overlay { opacity:1; }
.file-hidden { display:none; }
.photo-actions { margin-top:14px; }
.photo-del {
  background:none; border:1px solid rgba(248,113,113,.2); color:#f87171;
  padding:6px 14px; border-radius:8px; font-size:11px; font-weight:600;
  font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s;
}
.photo-del:hover { background:rgba(248,113,113,.1); }
.photo-hint { font-size:10px; color:#475569; margin-top:10px; }

/* USER INFO */
.user-info-zone { padding:0 24px 24px; text-align:center; }
.ui-name { font-size:18px; font-weight:800; color:#f8fafc; margin:0 0 8px; }
.ui-role {
  display:inline-block; padding:4px 14px; border-radius:99px;
  font-size:11px; font-weight:700; margin-bottom:8px;
}
.role-admin { background:rgba(234,88,12,.15); color:#fb923c; border:1px solid rgba(234,88,12,.2); }
.role-responsable { background:rgba(79,70,229,.15); color:#a5b4fc; border:1px solid rgba(79,70,229,.2); }
.role-employe { background:rgba(16,185,129,.12); color:#6ee7b7; border:1px solid rgba(16,185,129,.2); }
.ui-email { display:block; font-size:12px; color:#64748b; margin-bottom:16px; }
.ui-details { border-top:1px solid #1e293b; padding-top:16px; }
.uid-row { display:flex; justify-content:space-between; padding:8px 0; }
.uid-label { font-size:12px; color:#475569; font-weight:600; }
.uid-val { font-size:12px; color:#e2e8f0; font-weight:600; }
.uid-solde { color:#a5b4fc; font-size:14px; font-weight:800; }

/* FORM */
.form-body { padding:24px; display:flex; flex-direction:column; gap:18px; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.field-group { display:flex; flex-direction:column; gap:8px; }
.field-label { font-size:12px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }
.input-wrap {
  display:flex; align-items:center; gap:10px;
  background:#1e293b; border:1px solid #334155;
  border-radius:12px; padding:12px 16px; transition:border-color .2s, box-shadow .2s;
}
.input-wrap.focused { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.15); }
.input-wrap.error { border-color:rgba(248,113,113,.5); }
.input-icon { font-size:15px; flex-shrink:0; }
.field-input {
  background:none; border:none; outline:none;
  font-size:13px; font-family:'Sora',sans-serif; color:#e2e8f0; flex:1;
}
.field-input::placeholder { color:#475569; }
.toggle-pass { background:none; border:none; cursor:pointer; font-size:15px; padding:0; opacity:.6; transition:opacity .2s; }
.toggle-pass:hover { opacity:1; }

.strength-bar { height:3px; background:#1e293b; border-radius:99px; overflow:hidden; margin-top:6px; }
.strength-fill { height:100%; border-radius:99px; transition:width .4s, background .4s; }

.alert { border-radius:10px; padding:11px 14px; font-size:13px; font-weight:500; }
.alert-success { background:rgba(74,222,128,.1); color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.alert-error { background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.2); }

.submit-btn {
  width:100%; padding:14px;
  background:linear-gradient(135deg,#4f46e5,#7c3aed);
  border:none; border-radius:12px; color:white;
  font-size:14px; font-weight:700; font-family:'Sora',sans-serif;
  cursor:pointer; transition:opacity .2s, transform .15s;
  display:flex; align-items:center; justify-content:center;
}
.submit-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
.submit-btn:disabled { opacity:.35; cursor:not-allowed; }
.btn-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }

/* LOADER */
.loader-wrap { display:flex; flex-direction:column; align-items:center; padding:60px; gap:14px; color:#475569; font-size:13px; }
.spinner { width:34px; height:34px; border:3px solid #1e293b; border-top-color:#4f46e5; border-radius:50%; animation:spin .7s linear infinite; }

/* TOAST */
.toast { position:fixed; bottom:28px; right:28px; padding:14px 22px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; z-index:9999; font-family:'Sora',sans-serif; }
.toast-success { background:#052e16; color:#4ade80; border:1px solid rgba(74,222,128,.2); box-shadow:0 4px 24px rgba(74,222,128,.15); }
.toast-error { background:#1a0a0a; color:#f87171; border:1px solid rgba(248,113,113,.2); box-shadow:0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active,.toast-leave-active { transition:all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(20px) scale(.95); }

.fade-enter-active,.fade-leave-active { transition:opacity .3s; }
.fade-enter-from,.fade-leave-to { opacity:0; }

/* RESPONSIVE */
@media (max-width:900px) { .profile-grid { grid-template-columns:1fr; } }
@media (max-width:700px) { .db { padding:16px 14px 50px; } .page-title { font-size:22px; } .form-grid { grid-template-columns:1fr; } }
</style>