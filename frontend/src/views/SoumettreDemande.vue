<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Employé</div>
        <h1 class="page-title">Nouvelle demande</h1>
      </div>
      <div class="topbar-right">
        <div class="date-pill">📅 {{ todayLabel }}</div>
      </div>
    </div>

    <!-- MAIN LAYOUT -->
    <div class="main-grid">

      <!-- FORMULAIRE -->
      <div class="card form-card">
        <div class="card-hd">
          <span class="card-title">Soumettre un congé</span>
          <span class="card-sub">Formulaire</span>
        </div>
        <div class="form-body">

          <!-- Type de congé -->
          <div class="field-group">
            <label class="field-label">Type de congé</label>
            <div class="type-grid">
              <div
                v-for="t in typesConge"
                :key="t.val"
                :class="['type-card', { selected: typeConge === t.val }]"
                @click="typeConge = t.val"
              >
                <span class="type-icon">{{ t.icon }}</span>
                <span class="type-name">{{ t.label }}</span>
                <div class="type-check" v-if="typeConge === t.val">✓</div>
              </div>
            </div>
          </div>

          <!-- Dates -->
          <div class="row-2">
            <div class="field-group">
              <label class="field-label">Date de début</label>
              <div class="input-wrap" :class="{ focused: focusDebut }">
                <span class="input-icon">📅</span>
                <input
                  type="date"
                  v-model="dateDebut"
                  class="field-input"
                  :min="today"
                  @focus="focusDebut = true"
                  @blur="focusDebut = false"
                  required
                />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Date de fin</label>
              <div class="input-wrap" :class="{ focused: focusFin }">
                <span class="input-icon">📅</span>
                <input
                  type="date"
                  v-model="dateFin"
                  class="field-input"
                  :min="dateDebut || today"
                  @focus="focusFin = true"
                  @blur="focusFin = false"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Preview durée -->
          <div class="duree-preview" v-if="dateDebut && dateFin && dureePreview > 0">
            <span class="duree-icon">⏱️</span>
            <span class="duree-text">Durée : <strong>{{ dureePreview }} jour{{ dureePreview > 1 ? 's' : '' }}</strong></span>
          </div>

          <!-- Alerte erreur date -->
          <div class="alert alert-error" v-if="dateErreur">
            ⚠️ {{ dateErreur }}
          </div>

          <!-- Motif -->
          <div class="field-group">
            <label class="field-label">Motif</label>
            <div class="input-wrap textarea-wrap" :class="{ focused: focusMotif }">
              <textarea
                v-model="motif"
                class="field-input field-textarea"
                placeholder="Décrivez la raison de votre demande…"
                rows="4"
                @focus="focusMotif = true"
                @blur="focusMotif = false"
                required
              ></textarea>
            </div>
          </div>

          <!-- Pièce jointe -->
          <div class="field-group">
            <label class="field-label">Pièce jointe <span class="optional">(facultatif)</span></label>
            <div
              class="upload-zone"
              :class="{ dragging: isDragging, hasFile: fichier }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                type="file"
                ref="fileInput"
                @change="handleFile"
                class="file-hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <div v-if="!fichier" class="upload-placeholder">
                <span class="upload-icon">📎</span>
                <span class="upload-text">Glissez un fichier ici ou cliquez pour sélectionner</span>
                <span class="upload-hint">PDF, JPG, PNG, DOC — Max 5 Mo</span>
              </div>
              <div v-else class="upload-file">
                <span class="file-icon">📄</span>
                <div class="file-info">
                  <span class="file-name">{{ fichier.name }}</span>
                  <span class="file-size">{{ formatSize(fichier.size) }}</span>
                </div>
                <button class="file-remove" @click.stop="fichier = null" title="Retirer">✕</button>
              </div>
            </div>
          </div>

          <!-- Bouton -->
          <button
            class="submit-btn"
            @click="soumettreDemande"
            :disabled="loading || !dateDebut || !dateFin || !motif || !!dateErreur"
            :class="{ loading }"
          >
            <span v-if="!loading">🚀 Envoyer la demande</span>
            <span v-else class="btn-spinner"></span>
          </button>

          <!-- Feedback -->
          <transition name="fade">
            <div class="alert alert-success" v-if="message">✅ {{ message }}</div>
          </transition>
          <transition name="fade">
            <div class="alert alert-error" v-if="erreur && !dateErreur">❌ {{ erreur }}</div>
          </transition>

        </div>
      </div>

      <!-- SIDEBAR INFO -->
      <div class="side-col">

        <!-- Récapitulatif -->
        <div class="card recap-card">
          <div class="card-hd">
            <span class="card-title">Récapitulatif</span>
            <span class="card-sub">Aperçu</span>
          </div>
          <div class="recap-body">
            <div class="recap-row">
              <span class="recap-label">Type</span>
              <span class="recap-val">{{ typeLabel }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-label">Début</span>
              <span class="recap-val">{{ dateDebut ? formatDate(dateDebut) : '—' }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-label">Fin</span>
              <span class="recap-val">{{ dateFin ? formatDate(dateFin) : '—' }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-label">Durée</span>
              <span class="recap-val recap-highlight">{{ dureePreview > 0 ? dureePreview + 'j' : '—' }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-label">Pièce jointe</span>
              <span class="recap-val">{{ fichier ? '📎 Oui' : '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Conseils -->
        <div class="card tips-card">
          <div class="card-hd">
            <span class="card-title">Conseils</span>
            <span class="card-sub">Aide</span>
          </div>
          <div class="tips-body">
            <div class="tip" v-for="(tip, i) in tips" :key="i">
              <span class="tip-icon">{{ tip.icon }}</span>
              <div>
                <div class="tip-title">{{ tip.title }}</div>
                <div class="tip-desc">{{ tip.desc }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
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
  name: 'SoumettreDemande',
  data() {
    return {
      dateDebut: '',
      dateFin: '',
      motif: '',
      fichier: null,
      typeConge: 'annuel',
      message: '',
      erreur: '',
      loading: false,
      isDragging: false,
      focusDebut: false,
      focusFin: false,
      focusMotif: false,
      toast: { visible: false, message: '', type: 'success' },
      typesConge: [
        { val: 'annuel', label: 'Annuel', icon: '🌴' },
        { val: 'maladie', label: 'Maladie', icon: '🏥' },
        { val: 'familial', label: 'Familial', icon: '👨‍👩‍👧' },
        { val: 'autre', label: 'Autre', icon: '📝' },
      ],
      tips: [
        { icon: '💡', title: 'Anticipez', desc: 'Soumettez vos demandes au moins 2 semaines à l\'avance.' },
        { icon: '📎', title: 'Justificatifs', desc: 'Joignez un certificat médical pour les congés maladie.' },
        { icon: '⏰', title: 'Délai', desc: 'Votre responsable dispose de 48h pour traiter votre demande.' },
      ],
    };
  },

  computed: {
    todayLabel() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    },
    today() {
      return new Date().toISOString().split('T')[0];
    },
    dureePreview() {
      if (!this.dateDebut || !this.dateFin) return 0;
      const d = Math.round((new Date(this.dateFin) - new Date(this.dateDebut)) / 86400000) + 1;
      return d > 0 ? d : 0;
    },
    dateErreur() {
      if (this.dateDebut && this.dateFin && new Date(this.dateFin) < new Date(this.dateDebut)) {
        return 'La date de fin doit être après la date de début.';
      }
      return '';
    },
    typeLabel() {
      const t = this.typesConge.find(x => x.val === this.typeConge);
      return t ? `${t.icon} ${t.label}` : '—';
    },
  },

  methods: {
    async soumettreDemande() {
      this.message = '';
      this.erreur = '';
      if (this.dateErreur) return;

      this.loading = true;
      try {
        const formData = new FormData();
        formData.append('dateDebut', this.dateDebut);
        formData.append('dateFin', this.dateFin);
        formData.append('motif', this.motif);
        if (this.fichier) {
          formData.append('fichier', this.fichier);
        }

        await axios.post('/conges', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        this.message = 'Demande envoyée avec succès !';
        this.showToast('Demande envoyée avec succès !', 'success');
        this.dateDebut = '';
        this.dateFin = '';
        this.motif = '';
        this.fichier = null;
        this.typeConge = 'annuel';
      } catch (err) {
        const msg = err.response?.data?.message || 'Erreur lors de la soumission.';
        this.erreur = msg;
        this.showToast(msg, 'error');
      } finally {
        this.loading = false;
        setTimeout(() => { this.message = ''; this.erreur = ''; }, 5000);
      }
    },

    handleFile(event) {
      const file = event.target.files[0];
      if (file) this.fichier = file;
    },

    handleDrop(event) {
      this.isDragging = false;
      const file = event.dataTransfer.files[0];
      if (file) this.fichier = file;
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    },

    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' o';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
      return (bytes / 1048576).toFixed(1) + ' Mo';
    },

    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type };
      setTimeout(() => { this.toast.visible = false; }, 3500);
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

/* ── BASE ── */
.db {
  font-family: 'Sora', sans-serif;
  background: #0a0f1e;
  min-height: 100vh;
  padding: 28px 32px 60px;
  color: #e2e8f0;
}

/* ── TOPBAR ── */
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
.breadcrumb { font-size: 11px; color: #4a5568; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
.page-title { font-size: 28px; font-weight: 800; color: #f7fafc; letter-spacing: -.025em; margin: 0; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.date-pill { background: #111827; border: 1px solid #1e293b; border-radius: 99px; padding: 9px 18px; font-size: 12px; color: #94a3b8; font-weight: 500; text-transform: capitalize; }

/* ── MAIN GRID ── */
.main-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }

/* ── CARD ── */
.card { background: #111827; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; }
.card-hd { padding: 20px 24px 16px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.card-sub { font-size: 12px; color: #475569; background: #1e293b; padding: 3px 12px; border-radius: 99px; font-weight: 500; }

/* ── FORM ── */
.form-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; }
.optional { font-weight: 400; color: #475569; text-transform: none; letter-spacing: 0; }

.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: #1e293b; border: 1px solid #334155;
  border-radius: 12px; padding: 13px 16px;
  transition: border-color .2s, box-shadow .2s;
}
.input-wrap.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }
.textarea-wrap { align-items: flex-start; }
.input-icon { font-size: 16px; flex-shrink: 0; }
.field-input {
  background: none; border: none; outline: none;
  font-size: 13px; font-family: 'Sora', sans-serif;
  color: #e2e8f0; width: 100%;
}
.field-input::placeholder { color: #475569; }
.field-textarea { resize: none; line-height: 1.6; }
.field-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.5); cursor: pointer; }

/* ── TYPE CONGÉ ── */
.type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.type-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: #1e293b; border: 1px solid #334155;
  border-radius: 12px; padding: 14px 8px;
  cursor: pointer; position: relative; transition: all .2s;
}
.type-card:hover { border-color: #4f46e5; }
.type-card.selected { background: rgba(79,70,229,.12); border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
.type-icon { font-size: 22px; }
.type-name { font-size: 11px; font-weight: 700; color: #94a3b8; }
.type-card.selected .type-name { color: #a5b4fc; }
.type-check {
  position: absolute; top: 6px; right: 6px;
  width: 18px; height: 18px;
  background: #4f46e5; border-radius: 50%;
  color: white; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* ── DURÉE PREVIEW ── */
.duree-preview {
  display: flex; align-items: center; gap: 8px;
  background: rgba(79,70,229,.12); border: 1px solid rgba(79,70,229,.2);
  border-radius: 10px; padding: 10px 16px;
  font-size: 13px; color: #a5b4fc;
}
.duree-icon { font-size: 16px; }
.duree-text strong { font-weight: 700; color: #c4b5fd; }

/* ── UPLOAD ── */
.upload-zone {
  border: 2px dashed #334155;
  border-radius: 14px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all .25s;
  position: relative;
}
.upload-zone:hover { border-color: #4f46e5; background: rgba(79,70,229,.04); }
.upload-zone.dragging { border-color: #4f46e5; background: rgba(79,70,229,.08); }
.upload-zone.hasFile { border-style: solid; border-color: #1e293b; padding: 16px 20px; }
.file-hidden { display: none; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.upload-icon { font-size: 28px; }
.upload-text { font-size: 13px; color: #94a3b8; font-weight: 500; }
.upload-hint { font-size: 11px; color: #475569; }

.upload-file { display: flex; align-items: center; gap: 12px; }
.file-icon { font-size: 24px; }
.file-info { flex: 1; text-align: left; }
.file-name { font-size: 13px; font-weight: 600; color: #e2e8f0; display: block; }
.file-size { font-size: 11px; color: #475569; }
.file-remove {
  width: 28px; height: 28px;
  border-radius: 8px; border: 1px solid #334155;
  background: #1e293b; color: #94a3b8;
  cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-family: inherit;
}
.file-remove:hover { background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.3); color: #f87171; }

/* ── ALERTS ── */
.alert { border-radius: 10px; padding: 11px 16px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.alert-success { background: rgba(74,222,128,.1); color: #4ade80; border: 1px solid rgba(74,222,128,.2); }
.alert-error { background: rgba(248,113,113,.1); color: #f87171; border: 1px solid rgba(248,113,113,.2); }

/* ── SUBMIT ── */
.submit-btn {
  width: 100%; padding: 15px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: none; border-radius: 12px;
  color: white; font-size: 14px; font-weight: 700;
  font-family: 'Sora', sans-serif;
  cursor: pointer; transition: opacity .2s, transform .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.submit-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.submit-btn:disabled { opacity: .4; cursor: not-allowed; }
.submit-btn.loading { pointer-events: none; }
.btn-spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── SIDEBAR ── */
.side-col { display: flex; flex-direction: column; gap: 20px; }

/* Récap */
.recap-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 0; }
.recap-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #1a2236;
}
.recap-row:last-child { border-bottom: none; }
.recap-label { font-size: 12px; color: #475569; font-weight: 600; }
.recap-val { font-size: 13px; color: #e2e8f0; font-weight: 600; }
.recap-highlight { color: #a5b4fc; font-size: 16px; font-weight: 800; }

/* Tips */
.tips-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
.tip { display: flex; align-items: flex-start; gap: 12px; }
.tip-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.tip-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 3px; }
.tip-desc { font-size: 11px; color: #475569; line-height: 1.5; }

/* ── TRANSITIONS ── */
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── TOAST ── */
.toast { position: fixed; bottom: 28px; right: 28px; padding: 14px 22px; border-radius: 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; z-index: 9999; font-family: 'Sora', sans-serif; }
.toast-success { background: #052e16; color: #4ade80; border: 1px solid rgba(74,222,128,.2); box-shadow: 0 4px 24px rgba(74,222,128,.15); }
.toast-error { background: #1a0a0a; color: #f87171; border: 1px solid rgba(248,113,113,.2); box-shadow: 0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active, .toast-leave-active { transition: all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px) scale(.95); }

/* ── RESPONSIVE ── */
@media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .db { padding: 16px 14px 50px; } .page-title { font-size: 22px; } .topbar { flex-direction: column; align-items: flex-start; } .type-grid { grid-template-columns: repeat(2, 1fr); } .row-2 { grid-template-columns: 1fr; } }
</style>