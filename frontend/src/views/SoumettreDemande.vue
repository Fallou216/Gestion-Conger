<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Employé</div>
        <h1 class="page-title">Nouvelle demande</h1>
      </div>
      <div class="topbar-right">
        <div class="solde-pill" v-if="soldeInfo">
          🌴 Solde : <strong>{{ soldeInfo.solde }}j</strong> / {{ soldeInfo.droitAnnuel }}j
        </div>
      </div>
    </div>

    <div class="main-grid">

      <!-- FORMULAIRE -->
      <div class="card form-card">
        <div class="card-hd">
          <span class="card-title">Demande de congé</span>
          <span class="card-sub">Formulaire</span>
        </div>
        <div class="form-body">

          <!-- ÉTAPE 1 : Catégorie -->
          <div class="field-group">
            <label class="field-label">Catégorie de congé</label>
            <div class="cat-grid">
              <div :class="['cat-card', { selected: categorie === 'annuel' }]" @click="categorie = 'annuel'; motifExceptionnel = ''">
                <span class="cat-icon">🌴</span>
                <span class="cat-name">Annuel</span>
                <span class="cat-desc">Congés payés</span>
                <div class="cat-check" v-if="categorie === 'annuel'">✓</div>
              </div>
              <div :class="['cat-card', { selected: categorie === 'exceptionnel' }]" @click="categorie = 'exceptionnel'; periodeAnnuel = ''">
                <span class="cat-icon">⭐</span>
                <span class="cat-name">Exceptionnel</span>
                <span class="cat-desc">Non déductible</span>
                <div class="cat-check" v-if="categorie === 'exceptionnel'">✓</div>
              </div>
              <div :class="['cat-card', { selected: categorie === 'autre' }]" @click="categorie = 'autre'; motifExceptionnel = ''; periodeAnnuel = ''">
                <span class="cat-icon">📝</span>
                <span class="cat-name">Autre</span>
                <span class="cat-desc">Motif libre</span>
                <div class="cat-check" v-if="categorie === 'autre'">✓</div>
              </div>
            </div>
          </div>

          <!-- ÉTAPE 2a : Période (si annuel) -->
          <div class="field-group" v-if="categorie === 'annuel'">
            <label class="field-label">Période demandée</label>
            <div class="periode-grid">
              <div v-for="p in periodes" :key="p.val"
                :class="['per-card', { selected: periodeAnnuel === p.val }]"
                @click="periodeAnnuel = p.val">
                <span class="per-icon">{{ p.icon }}</span>
                <span class="per-name">{{ p.label }}</span>
              </div>
            </div>
          </div>

          <!-- ÉTAPE 2b : Motif exceptionnel (si exceptionnel) -->
          <div class="field-group" v-if="categorie === 'exceptionnel'">
            <label class="field-label">Motif exceptionnel</label>
            <div class="exc-list">
              <div v-for="e in motifsExceptionnels" :key="e.val"
                :class="['exc-card', { selected: motifExceptionnel === e.val }]"
                @click="motifExceptionnel = e.val">
                <div class="exc-left">
                  <span class="exc-icon">{{ e.icon }}</span>
                  <span class="exc-name">{{ e.label }}</span>
                </div>
                <span class="exc-jours">{{ e.jours }}j</span>
              </div>
            </div>
            <div class="exc-info" v-if="motifExceptionnel">
              <span>ℹ️</span>
              Congé exceptionnel non déductible du solde annuel. Justificatif obligatoire.
            </div>
          </div>

          <!-- Dates -->
          <div class="row-2">
            <div class="field-group">
              <label class="field-label">Date de début</label>
              <div class="input-wrap" :class="{ focused: focusDebut }">
                <span class="input-icon">📅</span>
                <input type="date" v-model="dateDebut" class="field-input" :min="today"
                  @focus="focusDebut = true" @blur="focusDebut = false" required />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Date de fin</label>
              <div class="input-wrap" :class="{ focused: focusFin }">
                <span class="input-icon">📅</span>
                <input type="date" v-model="dateFin" class="field-input" :min="dateDebut || today"
                  @focus="focusFin = true" @blur="focusFin = false" required />
              </div>
            </div>
          </div>

          <!-- Preview durée -->
          <div class="duree-preview" v-if="dateDebut && dateFin && joursOuvrables !== null">
            <span class="duree-icon">⏱️</span>
            <span class="duree-text">Durée : <strong>{{ isDemiJournee ? '½' : joursOuvrables }} jour{{ joursOuvrables > 1 && !isDemiJournee ? 's' : '' }} ouvrable{{ joursOuvrables > 1 ? 's' : '' }}</strong></span>
            <span class="duree-tag" v-if="categorie === 'exceptionnel'">Non déductible</span>
            <span class="duree-tag tag-solde" v-if="categorie === 'annuel' && soldeInfo">Solde après : {{ Math.max(0, soldeInfo.solde - (isDemiJournee ? 0.5 : joursOuvrables)) }}j</span>
          </div>

          <!-- Jours fériés exclus -->
          <div class="feries-info" v-if="feriesExclus.length > 0">
            <div class="feries-header">
              <span>🎉</span> {{ feriesExclus.length }} jour{{ feriesExclus.length > 1 ? 's' : '' }} férié{{ feriesExclus.length > 1 ? 's' : '' }} exclu{{ feriesExclus.length > 1 ? 's' : '' }} :
            </div>
            <div class="feries-list">
              <span class="ferie-chip" v-for="f in feriesExclus" :key="f.date">
                {{ formatDateShort(f.date) }} — {{ f.nom }}
              </span>
            </div>
          </div>

          <!-- Info dimanches exclus -->
          <div class="feries-info dimanche-info" v-if="dimanchesExclus > 0 && dateDebut && dateFin">
            <span>📅</span> {{ dimanchesExclus }} dimanche{{ dimanchesExclus > 1 ? 's' : '' }} exclu{{ dimanchesExclus > 1 ? 's' : '' }} du décompte
          </div>

          <!-- Alerte solde insuffisant -->
          <div class="alert alert-error" v-if="soldeInsuffisant">
            ⚠️ Solde insuffisant ! Vous avez {{ soldeInfo.solde }} jour(s) et demandez {{ joursOuvrables }} jour(s) ouvrables.
          </div>

          <!-- Alerte durée légale dépassée -->
          <div class="alert alert-error" v-if="dureeLegaleDepassee">
            ⚠️ Ce congé exceptionnel est limité à {{ dureeLegaleMax }} jour(s) selon le Code du Travail.
          </div>

          <div class="alert alert-error" v-if="dateErreur">⚠️ {{ dateErreur }}</div>

          <!-- Motif -->
          <div class="field-group">
            <label class="field-label">Motif / Commentaire <span class="optional">({{ categorie === 'exceptionnel' ? 'précisez' : 'optionnel' }})</span></label>
            <div class="input-wrap textarea-wrap" :class="{ focused: focusMotif }">
              <textarea v-model="motif" class="field-input field-textarea"
                :placeholder="categorie === 'exceptionnel' ? 'Précisez les détails…' : 'Congé annuel, raison personnelle…'"
                rows="3" @focus="focusMotif = true" @blur="focusMotif = false"></textarea>
            </div>
          </div>

          <!-- Pièce jointe -->
          <div class="field-group">
            <label class="field-label">
              Pièce jointe
              <span class="optional" v-if="categorie !== 'exceptionnel'">(facultatif)</span>
              <span class="required-tag" v-else>Obligatoire</span>
            </label>
            <div class="upload-zone" :class="{ hasFile: fichier }" @click="$refs.fileInput.click()">
              <input type="file" ref="fileInput" @change="handleFile" class="file-hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              <div v-if="!fichier" class="upload-placeholder">
                <span class="upload-icon">📎</span>
                <span class="upload-text">Cliquez pour joindre un justificatif</span>
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
          <button class="submit-btn" @click="soumettre"
            :disabled="loading || !canSubmit" :class="{ loading }">
            <span v-if="!loading">🚀 Envoyer la demande</span>
            <span v-else class="btn-spinner"></span>
          </button>

          <transition name="fade">
            <div class="alert alert-success" v-if="message">✅ {{ message }}</div>
          </transition>
          <transition name="fade">
            <div class="alert alert-error" v-if="erreur">❌ {{ erreur }}</div>
          </transition>
        </div>
      </div>

      <!-- SIDEBAR RÉCAP -->
      <div class="side-col">
        <div class="card">
          <div class="card-hd">
            <span class="card-title">Récapitulatif</span>
          </div>
          <div class="recap-body">
            <div class="recap-row">
              <span class="recap-label">Catégorie</span>
              <span class="recap-val">{{ categorieLabel }}</span>
            </div>
            <div class="recap-row" v-if="categorie === 'annuel' && periodeAnnuel">
              <span class="recap-label">Période</span>
              <span class="recap-val">{{ periodeLabel }}</span>
            </div>
            <div class="recap-row" v-if="categorie === 'exceptionnel' && motifExceptionnel">
              <span class="recap-label">Motif</span>
              <span class="recap-val">{{ excLabel }}</span>
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
              <span class="recap-val recap-highlight">{{ joursOuvrables !== null ? (isDemiJournee ? '½j' : joursOuvrables + 'j ouvrables') : '—' }}</span>
            </div>
            <div class="recap-row" v-if="feriesExclus.length > 0">
              <span class="recap-label">Fériés exclus</span>
              <span class="recap-val" style="color:#fb923c;">{{ feriesExclus.length }}j</span>
            </div>
            <div class="recap-row">
              <span class="recap-label">Déductible</span>
              <span class="recap-val" :style="{ color: categorie === 'exceptionnel' ? '#4ade80' : '#fb923c' }">
                {{ categorie === 'exceptionnel' ? 'Non ✓' : 'Oui' }}
              </span>
            </div>
            <div class="recap-row">
              <span class="recap-label">Justificatif</span>
              <span class="recap-val">{{ fichier ? '📎 Oui' : '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Règles légales -->
        <div class="card">
          <div class="card-hd">
            <span class="card-title">Règles légales</span>
            <span class="card-sub">Sénégal</span>
          </div>
          <div class="rules-body">
            <div class="rule">
              <span class="rule-icon">📜</span>
              <div>
                <div class="rule-title">Congés annuels</div>
                <div class="rule-desc">2 jours ouvrables par mois de service, soit 24 jours/an. Déductible du solde.</div>
              </div>
            </div>
            <div class="rule">
              <span class="rule-icon">⭐</span>
              <div>
                <div class="rule-title">Congés exceptionnels</div>
                <div class="rule-desc">Non déductibles du solde annuel. Justificatif obligatoire. Durée fixée par la loi.</div>
              </div>
            </div>
            <div class="rule">
              <span class="rule-icon">📎</span>
              <div>
                <div class="rule-title">Justificatifs</div>
                <div class="rule-desc">Obligatoire pour les congés exceptionnels (acte de mariage, certificat de décès, etc.)</div>
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
      categorie: 'annuel',
      periodeAnnuel: 'totalite',
      motifExceptionnel: '',
      dateDebut: '', dateFin: '', motif: '', fichier: null,
      message: '', erreur: '', loading: false,
      focusDebut: false, focusFin: false, focusMotif: false,
      toast: { visible: false, message: '', type: 'success' },
      soldeInfo: null,
      joursOuvrables: null,
      feriesExclus: [],
      dimanchesExclus: 0,
      periodes: [
        { val: 'totalite', label: 'La totalité', icon: '📅' },
        { val: 'partie', label: 'Une partie', icon: '📊' },
        { val: 'matinee', label: 'Matinée', icon: '🌅' },
        { val: 'apres_midi', label: 'Après-midi', icon: '🌇' },
        { val: 'journee', label: 'Journée entière', icon: '☀️' },
      ],
      motifsExceptionnels: [
        { val: 'mariage_employe', label: 'Mariage de l\'employé', icon: '💍', jours: 3 },
        { val: 'mariage_enfant_frere_soeur', label: 'Mariage enfant/frère/sœur', icon: '💒', jours: 1 },
        { val: 'deces_conjoint_descendant', label: 'Décès conjoint/descendant', icon: '🕊️', jours: 5 },
        { val: 'deces_ascendant_frere_soeur', label: 'Décès ascendant/frère/sœur', icon: '🕊️', jours: 2 },
        { val: 'deces_beau_pere_belle_mere', label: 'Décès beau-père/belle-mère', icon: '🕊️', jours: 2 },
        { val: 'naissance_enfant', label: 'Naissance d\'un enfant', icon: '👶', jours: 1 },
        { val: 'bapteme_enfant', label: 'Baptême d\'un enfant', icon: '⛪', jours: 1 },
        { val: 'premiere_communion', label: 'Première communion', icon: '🙏', jours: 1 },
        { val: 'hospitalisation_famille', label: 'Hospitalisation conjoint/enfant', icon: '🏥', jours: 3 },
      ],
    };
  },

  computed: {
    today() { return new Date().toISOString().split('T')[0]; },
    dureePreview() {
      if (!this.dateDebut || !this.dateFin) return 0;
      const d = Math.max(1, Math.round((new Date(this.dateFin) - new Date(this.dateDebut)) / 86400000) + 1);
      return d > 0 ? d : 0;
    },
    isDemiJournee() {
      return this.categorie === 'annuel' && (this.periodeAnnuel === 'matinee' || this.periodeAnnuel === 'apres_midi');
    },
    dateErreur() {
      if (this.dateDebut && this.dateFin && new Date(this.dateFin) < new Date(this.dateDebut))
        return 'La date de fin doit être après la date de début.';
      return '';
    },
    soldeInsuffisant() {
      if (this.categorie !== 'annuel' || !this.soldeInfo || this.joursOuvrables === null) return false;
      const demande = this.isDemiJournee ? 0.5 : this.joursOuvrables;
      return demande > this.soldeInfo.solde;
    },
    dureeLegaleMax() {
      if (this.categorie !== 'exceptionnel' || !this.motifExceptionnel) return 0;
      const e = this.motifsExceptionnels.find(x => x.val === this.motifExceptionnel);
      return e ? e.jours : 0;
    },
    dureeLegaleDepassee() {
      if (!this.dureeLegaleMax || this.joursOuvrables === null) return false;
      return this.joursOuvrables > this.dureeLegaleMax;
    },
    canSubmit() {
      if (!this.dateDebut || !this.dateFin || this.dateErreur) return false;
      if (this.joursOuvrables === null || this.joursOuvrables <= 0) return false;
      if (this.soldeInsuffisant || this.dureeLegaleDepassee) return false;
      if (this.categorie === 'exceptionnel' && !this.motifExceptionnel) return false;
      return true;
    },
    categorieLabel() {
      if (this.categorie === 'annuel') return '🌴 Annuel';
      if (this.categorie === 'exceptionnel') return '⭐ Exceptionnel';
      return '📝 Autre';
    },
    periodeLabel() {
      const p = this.periodes.find(x => x.val === this.periodeAnnuel);
      return p ? p.label : '—';
    },
    excLabel() {
      const e = this.motifsExceptionnels.find(x => x.val === this.motifExceptionnel);
      return e ? e.label : '—';
    },
  },

  watch: {
    dateDebut() { this.calculerOuvrables(); },
    dateFin() { this.calculerOuvrables(); },
  },

  methods: {
    async calculerOuvrables() {
      if (!this.dateDebut || !this.dateFin || new Date(this.dateFin) < new Date(this.dateDebut)) {
        this.joursOuvrables = null;
        this.feriesExclus = [];
        this.dimanchesExclus = 0;
        return;
      }
      try {
        const res = await axios.get(`/feries/calculer?dateDebut=${this.dateDebut}&dateFin=${this.dateFin}`);
        this.joursOuvrables = res.data.joursOuvrables;
        this.feriesExclus = res.data.joursFeries || [];
        this.dimanchesExclus = res.data.dimanches || 0;
      } catch {
        // Fallback calcul simple si API échoue
        this.joursOuvrables = Math.max(1, Math.round((new Date(this.dateFin) - new Date(this.dateDebut)) / 86400000) + 1);
        this.feriesExclus = [];
        this.dimanchesExclus = 0;
      }
    },

    async chargerSolde() {
      try {
        const res = await axios.get('/conges/solde');
        this.soldeInfo = res.data;
      } catch { console.error('Erreur chargement solde'); }
    },

    async soumettre() {
      this.message = ''; this.erreur = '';
      if (!this.canSubmit) return;
      this.loading = true;
      try {
        const formData = new FormData();
        formData.append('dateDebut', this.dateDebut);
        formData.append('dateFin', this.dateFin);
        formData.append('motif', this.motif);
        formData.append('categorie', this.categorie);
        if (this.categorie === 'annuel') formData.append('periodeAnnuel', this.periodeAnnuel);
        if (this.categorie === 'exceptionnel') formData.append('motifExceptionnel', this.motifExceptionnel);
        if (this.fichier) formData.append('fichier', this.fichier);

        await axios.post('/conges', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        this.message = 'Demande envoyée avec succès !';
        this.showToast('Demande envoyée !', 'success');
        this.dateDebut = ''; this.dateFin = ''; this.motif = ''; this.fichier = null;
        this.categorie = 'annuel'; this.periodeAnnuel = 'totalite'; this.motifExceptionnel = '';
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
        await this.chargerSolde();
      } catch (err) {
        this.erreur = err.response?.data?.message || 'Erreur lors de la soumission.';
        this.showToast(this.erreur, 'error');
      } finally {
        this.loading = false;
        setTimeout(() => { this.message = ''; this.erreur = ''; }, 5000);
      }
    },

    handleFile(e) { const f = e.target.files[0]; if (f) this.fichier = f; },
    formatDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); },
    formatDateShort(d) { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); },
    formatSize(b) { if (b < 1024) return b + ' o'; if (b < 1048576) return (b/1024).toFixed(1) + ' Ko'; return (b/1048576).toFixed(1) + ' Mo'; },
    showToast(message, type = 'success') { this.toast = { visible: true, message, type }; setTimeout(() => { this.toast.visible = false; }, 3500); },
  },

  mounted() { this.chargerSolde(); },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.db { font-family:'Sora',sans-serif; background:#0a0f1e; min-height:100vh; padding:28px 32px 60px; color:#e2e8f0; }
.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.breadcrumb { font-size:11px; color:#4a5568; letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:#f7fafc; letter-spacing:-.025em; margin:0; }
.solde-pill { background:linear-gradient(135deg,#1e1b4b,#312e81); border:1px solid rgba(99,102,241,.3); border-radius:99px; padding:10px 20px; font-size:13px; color:#a5b4fc; font-weight:600; }
.solde-pill strong { color:#c4b5fd; font-weight:800; }

.main-grid { display:grid; grid-template-columns:1.5fr 1fr; gap:20px; }
.side-col { display:flex; flex-direction:column; gap:20px; }

.card { background:#111827; border:1px solid #1e293b; border-radius:20px; overflow:hidden; }
.card-hd { padding:20px 24px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; }
.card-title { font-size:15px; font-weight:700; color:#f1f5f9; }
.card-sub { font-size:12px; color:#475569; background:#1e293b; padding:3px 12px; border-radius:99px; font-weight:500; }
.form-body { padding:24px; display:flex; flex-direction:column; gap:20px; }
.field-group { display:flex; flex-direction:column; gap:8px; }
.field-label { font-size:12px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }
.optional { font-weight:400; color:#475569; text-transform:none; letter-spacing:0; }
.required-tag { font-weight:700; color:#fb923c; text-transform:none; letter-spacing:0; font-size:11px; }
.row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

/* CATÉGORIE */
.cat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.cat-card { display:flex; flex-direction:column; align-items:center; gap:6px; background:#1e293b; border:1px solid #334155; border-radius:14px; padding:18px 10px; cursor:pointer; position:relative; transition:all .2s; text-align:center; }
.cat-card:hover { border-color:#4f46e5; }
.cat-card.selected { background:rgba(79,70,229,.12); border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.cat-icon { font-size:26px; }
.cat-name { font-size:13px; font-weight:700; color:#e2e8f0; }
.cat-desc { font-size:10px; color:#475569; }
.cat-card.selected .cat-name { color:#a5b4fc; }
.cat-check { position:absolute; top:8px; right:8px; width:20px; height:20px; background:#4f46e5; border-radius:50%; color:white; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }

/* PÉRIODE ANNUEL */
.periode-grid { display:flex; flex-wrap:wrap; gap:8px; }
.per-card { display:flex; align-items:center; gap:8px; background:#1e293b; border:1px solid #334155; border-radius:10px; padding:10px 16px; cursor:pointer; transition:all .2s; }
.per-card:hover { border-color:#4f46e5; }
.per-card.selected { background:rgba(79,70,229,.12); border-color:#4f46e5; }
.per-icon { font-size:16px; }
.per-name { font-size:12px; font-weight:600; color:#94a3b8; }
.per-card.selected .per-name { color:#a5b4fc; }

/* EXCEPTIONNELS */
.exc-list { display:flex; flex-direction:column; gap:6px; }
.exc-card { display:flex; align-items:center; justify-content:space-between; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:12px 16px; cursor:pointer; transition:all .2s; }
.exc-card:hover { border-color:#4f46e5; }
.exc-card.selected { background:rgba(79,70,229,.12); border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.08); }
.exc-left { display:flex; align-items:center; gap:10px; }
.exc-icon { font-size:18px; }
.exc-name { font-size:12px; font-weight:600; color:#e2e8f0; }
.exc-card.selected .exc-name { color:#a5b4fc; }
.exc-jours { font-size:12px; font-weight:800; color:#818cf8; background:rgba(79,70,229,.15); padding:4px 10px; border-radius:99px; }
.exc-info { display:flex; align-items:center; gap:8px; background:rgba(251,146,60,.08); border:1px solid rgba(251,146,60,.2); border-radius:10px; padding:10px 14px; font-size:12px; color:#fb923c; font-weight:500; margin-top:4px; }

/* INPUTS */
.input-wrap { display:flex; align-items:center; gap:10px; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:13px 16px; transition:border-color .2s, box-shadow .2s; }
.input-wrap.focused { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.15); }
.textarea-wrap { align-items:flex-start; }
.input-icon { font-size:16px; flex-shrink:0; }
.field-input { background:none; border:none; outline:none; font-size:13px; font-family:'Sora',sans-serif; color:#e2e8f0; width:100%; }
.field-input::placeholder { color:#475569; }
.field-textarea { resize:none; line-height:1.6; }
.field-input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.5); cursor:pointer; }

/* DURÉE */
.duree-preview { display:flex; align-items:center; gap:8px; background:rgba(79,70,229,.12); border:1px solid rgba(79,70,229,.2); border-radius:10px; padding:10px 16px; font-size:13px; color:#a5b4fc; flex-wrap:wrap; }
.duree-icon { font-size:16px; }
.duree-text strong { font-weight:700; color:#c4b5fd; }
.duree-tag { font-size:10px; font-weight:700; padding:3px 10px; border-radius:99px; background:rgba(74,222,128,.12); color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.tag-solde { background:rgba(251,146,60,.1); color:#fb923c; border-color:rgba(251,146,60,.2); }

/* FERIES INFO */
.feries-info { display:flex; flex-wrap:wrap; align-items:flex-start; gap:8px; background:rgba(251,146,60,.06); border:1px solid rgba(251,146,60,.15); border-radius:10px; padding:12px 16px; font-size:12px; color:#fb923c; font-weight:500; }
.feries-header { display:flex; align-items:center; gap:6px; font-weight:700; width:100%; }
.feries-list { display:flex; flex-wrap:wrap; gap:6px; }
.ferie-chip { background:rgba(251,146,60,.1); border:1px solid rgba(251,146,60,.2); border-radius:8px; padding:4px 10px; font-size:11px; color:#fb923c; font-weight:600; white-space:nowrap; }
.dimanche-info { background:rgba(99,102,241,.06); border-color:rgba(99,102,241,.15); color:#818cf8; }

/* UPLOAD */
.upload-zone { border:2px dashed #334155; border-radius:14px; padding:24px; text-align:center; cursor:pointer; transition:all .25s; }
.upload-zone:hover { border-color:#4f46e5; background:rgba(79,70,229,.04); }
.upload-zone.hasFile { border-style:solid; border-color:#1e293b; padding:14px 18px; }
.file-hidden { display:none; }
.upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:6px; }
.upload-icon { font-size:24px; }
.upload-text { font-size:12px; color:#94a3b8; font-weight:500; }
.upload-hint { font-size:10px; color:#475569; }
.upload-file { display:flex; align-items:center; gap:12px; }
.file-icon { font-size:20px; }
.file-info { flex:1; text-align:left; }
.file-name { font-size:12px; font-weight:600; color:#e2e8f0; display:block; }
.file-size { font-size:10px; color:#475569; }
.file-remove { width:26px; height:26px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#94a3b8; cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; transition:all .15s; font-family:inherit; }
.file-remove:hover { background:rgba(248,113,113,.12); border-color:rgba(248,113,113,.3); color:#f87171; }

.alert { border-radius:10px; padding:11px 16px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:8px; }
.alert-success { background:rgba(74,222,128,.1); color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.alert-error { background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.2); }

.submit-btn { width:100%; padding:15px; background:linear-gradient(135deg,#4f46e5,#7c3aed); border:none; border-radius:12px; color:white; font-size:14px; font-weight:700; font-family:'Sora',sans-serif; cursor:pointer; transition:opacity .2s, transform .15s; display:flex; align-items:center; justify-content:center; gap:8px; }
.submit-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
.submit-btn:disabled { opacity:.4; cursor:not-allowed; }
.btn-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }

/* RECAP */
.recap-body { padding:20px 24px; }
.recap-row { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid #1a2236; }
.recap-row:last-child { border-bottom:none; }
.recap-label { font-size:12px; color:#475569; font-weight:600; }
.recap-val { font-size:13px; color:#e2e8f0; font-weight:600; }
.recap-highlight { color:#a5b4fc; font-size:16px; font-weight:800; }

/* RULES */
.rules-body { padding:20px 24px; display:flex; flex-direction:column; gap:18px; }
.rule { display:flex; align-items:flex-start; gap:12px; }
.rule-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
.rule-title { font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:3px; }
.rule-desc { font-size:11px; color:#475569; line-height:1.5; }

/* TRANSITIONS */
.fade-enter-active,.fade-leave-active { transition:opacity .3s; }
.fade-enter-from,.fade-leave-to { opacity:0; }
.toast { position:fixed; bottom:28px; right:28px; padding:14px 22px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; z-index:9999; font-family:'Sora',sans-serif; }
.toast-success { background:#052e16; color:#4ade80; border:1px solid rgba(74,222,128,.2); box-shadow:0 4px 24px rgba(74,222,128,.15); }
.toast-error { background:#1a0a0a; color:#f87171; border:1px solid rgba(248,113,113,.2); box-shadow:0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active,.toast-leave-active { transition:all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(20px) scale(.95); }

@media (max-width:1000px) { .main-grid{grid-template-columns:1fr;} }
@media (max-width:700px) { .db{padding:16px 14px 50px;} .page-title{font-size:22px;} .topbar{flex-direction:column;align-items:flex-start;} .cat-grid{grid-template-columns:1fr;} .row-2{grid-template-columns:1fr;} .periode-grid{flex-direction:column;} }
</style>