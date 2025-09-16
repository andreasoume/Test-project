//import React, { useState, ChangeEvent, FormEvent } from 'react';
import React, { useState, ChangeEvent } from 'react';
import styles from '../styles/quotationForm.module.css';
import referenceData from '../data/referenceData.json';

type TransportMode = (typeof referenceData.transportModes)[number];
type QuotationType = (typeof referenceData.quotationTypes)[number];

type FormData = {
  transportMode: TransportMode;
  incoterm: string;
  scope: string;
  originCountry: string;
  originCity: string;
  originDate: string;
  destinationCountry: string;
  destinationCity: string;
  destinationDate: string;

  QuotationType: QuotationType;
  volume: string;
  weight: string;
  temperatureControlled: boolean;
  dangerousGoods: boolean;
  customsFormalities: boolean;
  insurance: boolean;
  comment: string;
  files: File[];

  firstName: string;
  lastName: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  jobTitle: string;

  companyName: string;
  companyAddress: string;
  postalCode: string;
  companyCity: string;
  companyCountry: string;
  website: string;

  declarationCertified: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
};

const QuotationForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    transportMode: referenceData.transportModes[0],
    incoterm: '',
    scope: '',
    originCountry: '',
    originCity: '',
    originDate: '',
    destinationCountry: '',
    destinationCity: '',
    destinationDate: '',

    QuotationType: referenceData.quotationTypes[0],
    volume: '',
    weight: '',
    temperatureControlled: false,
    dangerousGoods: false,
    customsFormalities: false,
    insurance: false,
    comment: '',
    files: [],

    firstName: '',
    lastName: '',
    phoneCode: '+33',
    phoneNumber: '',
    email: '',
    jobTitle: '',

    companyName: '',
    companyAddress: '',
    postalCode: '',
    companyCity: '',
    companyCountry: '',
    website: '',
    declarationCertified: false,
    dataProcessingConsent: false,
    marketingConsent: false,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'originCountry' ? { originCity: '' } : {}),
        ...(name === 'destinationCountry' ? { destinationCity: '' } : {}),
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  // 🔹 1. Fonction utilitaire pour encoder en base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // "data:application/pdf;base64,JVBERi0x..."
      reader.onload = () => {
        // enlever le "data:xxx;base64," et garder uniquement le contenu
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 🔹 2. handleSubmit modifié
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Conversion fichiers -> base64
    const encodedFiles = await Promise.all(
      formData.files.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        content: await fileToBase64(file), // encodage base64
      }))
    );

    // Construction du payload à envoyer
    const payload = {
      ...formData,
      files: encodedFiles, // fichiers encodés en base64
    };

    const resp = await fetch(
      'https://68b60aa88dc4e791bf486048b0d517.48.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/03c680748a1c47c4b5602e967697daca/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=615BvSpG0DnNXMWXZghkeUy9CHwfbycGu9_MkOtWi_A',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-flow-secret': process.env.NEXT_PUBLIC_FLOW_SECRET || '',
        },
        body: JSON.stringify(payload),
      }
    );

    if (resp.ok) {
      setStep(6);
    } else {
      const error = await resp.text();
      alert('Erreur : ' + error);
    }
  }

  /*const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Données soumises :', formData);
    alert('Formulaire complet soumis !');
    setStep(6);
  };*/

  /*async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const resp = await fetch(
      "https://68b60aa88dc4e791bf486048b0d517.48.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/03c680748a1c47c4b5602e967697daca/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=615BvSpG0DnNXMWXZghkeUy9CHwfbycGu9_MkOtWi_A",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-flow-secret": process.env.NEXT_PUBLIC_FLOW_SECRET || "", // clé secrète côté front
        },
        body: JSON.stringify(formData),
      }
    );

    if (resp.ok) {
      setStep(6);
    } else {
      const error = await resp.text();
      alert("Erreur : " + error);
    }
  }*/

  /*
  const filteredOriginCities = referenceData.cities.filter(
    (c) => c.countryCode === formData.originCountry
  );
  const filteredDestinationCities = referenceData.cities.filter(
    (c) => c.countryCode === formData.destinationCountry
  ); */

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>COTATION</h1>

      {step !== 6 && (
        <div className={styles.steps}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`${styles.step} ${
                step >= n ? styles.stepChecked : ''
              } ${step === n ? styles.active : ''}`}
            >
              <span>
                {
                  [
                    'Données d’acheminement',
                    'Informations sur la cargaison',
                    'Informations de contact',
                    'Informations sur la société',
                    'Synthèse',
                  ][n - 1]
                }
              </span>
            </div>
          ))}
        </div>
      )}

      {/* === ÉTAPE 1 === */}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <h2>CHAMP D&rsquo;APPLICATION </h2>

          <label className={styles.label}>Mode de transport *</label>
          <div className={styles.radioGroup}>
            {referenceData.transportModes.map((mode) => (
              <label key={mode}>
                <input
                  type="radio"
                  name="transportMode"
                  value={mode}
                  checked={formData.transportMode === mode}
                  onChange={handleChange}
                />
                {mode}
              </label>
            ))}
          </div>

          <label className={styles.label}>Incoterms *</label>
          <select
            name="incoterm"
            value={formData.incoterm}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- Sélectionner --</option>
            {referenceData.incoterms.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          <label className={styles.label}>Périmètre *</label>
          <select
            name="scope"
            value={formData.scope}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- Sélectionner --</option>
            {referenceData.scopes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <h2>ORIGINE</h2>
          <label className={styles.label}>Pays *</label>
          <select
            name="originCountry"
            value={formData.originCountry}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">-- Sélectionner --</option>
            {referenceData.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          <label className={styles.label}>Ville *</label>
          <input
            type="text"
            name="originCity"
            value={formData.originCity}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Date de prise en charge *</label>
          <input
            type="date"
            name="originDate"
            value={formData.originDate}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <h2>DESTINATION</h2>
          <label className={styles.label}>Pays *</label>
          <select
            name="destinationCountry"
            value={formData.destinationCountry}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">-- Sélectionner --</option>
            {referenceData.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          <label className={styles.label}>Ville *</label>
          <input
            type="text"
            name="destinationCity"
            value={formData.destinationCity}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Date de livraison *</label>
          <input
            type="date"
            name="destinationDate"
            value={formData.destinationDate}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <br />
          <br />
          <button type="submit" className={`${styles.button} ${styles.next}`}>
            Suivant →
          </button>
        </form>
      )}

      {/* === ÉTAPE 2 === */}
      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(3);
          }}
        >
          <h2>INFORMATIONS SUR LA CARGAISON</h2>

          <label className={styles.label}>Type de cargaison *</label>
          <select
            name="QuotationType"
            value={formData.QuotationType}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- Sélectionner --</option>
            {referenceData.quotationTypes.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          <label className={styles.label}>Volume total (CBM) *</label>
          <input
            type="number"
            name="volume"
            value={formData.volume}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Poids total (KG) *</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <div className={styles.radioGroup}>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="temperatureControlled"
                checked={formData.temperatureControlled}
                onChange={handleChange}
              />{' '}
              Température contrôlée
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="dangerousGoods"
                checked={formData.dangerousGoods}
                onChange={handleChange}
              />{' '}
              Marchandise dangereuse
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="customsFormalities"
                checked={formData.customsFormalities}
                onChange={handleChange}
              />{' '}
              Formalités douanières
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="insurance"
                checked={formData.insurance}
                onChange={handleChange}
              />{' '}
              Assurance
            </label>
          </div>

          <p>
            <strong>Souhaitez-vous ajouter un commentaire à votre demande ?</strong>
          </p>

          <label className={styles.label}>Ecrivez ci-dessous</label>
          <textarea
            name="comment"
            rows={3}
            value={formData.comment}
            onChange={handleChange}
            className={styles.textarea}
          />

          <p>
            <strong>Souhaitez-vous joindre des fichiers à votre demande ?</strong>
          </p>

          <label className={styles.label}>Documents</label>
          <div className={styles.uploadBox}>
            <input type="file" multiple onChange={handleFileChange} />
            <p>Faites glisser les fichiers ici ou cliquez pour les télécharger</p>
          </div>

          {/* Affichage des fichiers ajoutés */}
          {formData.files.length > 0 && (
            <ul style={{ marginTop: '10px' }}>
              {formData.files.map((file, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        files: prev.files.filter((_, i) => i !== idx),
                      }));
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'red',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.buttons}>
            <button type="button" onClick={goBack} className={`${styles.button} ${styles.prev}`}>
              ← Précédent
            </button>
            <button type="submit" className={`${styles.button} ${styles.next}`}>
              Suivant →
            </button>
          </div>
        </form>
      )}

      {/* === ÉTAPE 3 === */}
      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(4);
          }}
        >
          <h2>INFORMATIONS DE CONTACT</h2>

          <label className={styles.label}>Prénom *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Nom *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Numéro de téléphone *</label>
          <div className={styles.flexRow}>
            <input
              style={{ width: 80 }}
              type="text"
              name="phoneCode"
              value={formData.phoneCode}
              onChange={handleChange}
              required
              className={styles.input}
            />
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <label className={styles.label}>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Intitulé du poste *</label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <div className={styles.buttons}>
            <button type="button" onClick={goBack} className={`${styles.button} ${styles.prev}`}>
              ← Précédent
            </button>
            <button type="submit" className={`${styles.button} ${styles.next}`}>
              Suivant →
            </button>
          </div>
        </form>
      )}

      {/* === ÉTAPE 4 === */}
      {step === 4 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(5);
          }}
        >
          <h2>INFORMATIONS SUR LA SOCIÉTÉ</h2>

          <label className={styles.label}>Nom de la société *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Adresse *</label>
          <input
            type="text"
            name="companyAddress"
            value={formData.companyAddress}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Code Postal *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Ville *</label>
          <input
            type="text"
            name="companyCity"
            value={formData.companyCity}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Pays *</label>
          <input
            type="text"
            name="companyCountry"
            value={formData.companyCountry}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>Site web</label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={styles.input}
          />

          <div className={styles.buttons}>
            <button type="button" onClick={goBack} className={`${styles.button} ${styles.prev}`}>
              ← Précédent
            </button>
            <button type="submit" className={`${styles.button} ${styles.next}`}>
              Suivant →
            </button>
          </div>
        </form>
      )}

      {/* === ÉTAPE 5 : SYNTHÈSE === */}
      {step === 5 && (
        <form onSubmit={handleSubmit}>
          <h3>DONNÉES D&rsquo;ACHEMINEMENT</h3>
          <p>
            <strong>Mode de transport :</strong> {formData.transportMode}
          </p>
          <p>
            <strong>Incoterm :</strong> {formData.incoterm}
          </p>
          <p>
            <strong>Scope :</strong> {formData.scope}
          </p>
          <p>
            <strong>Origine :</strong> {formData.originCity}, {formData.originCountry} –{' '}
            {formData.originDate}
          </p>
          <p>
            <strong>Destination :</strong> {formData.destinationCity}, {formData.destinationCountry}{' '}
            – {formData.destinationDate}
          </p>

          <h3>INFORMATIONS SUR LA CARGAISON</h3>
          <p>
            <strong>Type :</strong> {formData.QuotationType}
          </p>
          <p>
            <strong>Volume :</strong> {formData.volume} CBM
          </p>
          <p>
            <strong>Poids :</strong> {formData.weight} KG
          </p>
          <p>
            <strong>Température contrôlée :</strong>{' '}
            {formData.temperatureControlled ? 'Oui' : 'Non'}
          </p>
          <p>
            <strong>Marchandises dangereuses :</strong> {formData.dangerousGoods ? 'Oui' : 'Non'}
          </p>
          <p>
            <strong>Douanes :</strong> {formData.customsFormalities ? 'Oui' : 'Non'}
          </p>
          <p>
            <strong>Assurance :</strong> {formData.insurance ? 'Oui' : 'Non'}
          </p>
          {formData.comment && (
            <p>
              <strong>Commentaire :</strong> {formData.comment}
            </p>
          )}

          <h3>INFORMATIONS DE CONTACT</h3>
          <p>
            <strong>Nom :</strong> {formData.firstName} {formData.lastName}
          </p>
          <p>
            <strong>Email :</strong> {formData.email}
          </p>
          <p>
            <strong>Téléphone :</strong> {formData.phoneCode} {formData.phoneNumber}
          </p>
          <p>
            <strong>Poste :</strong> {formData.jobTitle}
          </p>

          <h3>INFORMATIONS SUR LA SOCIÉTÉ</h3>
          <p>
            <strong>Nom :</strong> {formData.companyName}
          </p>
          <p>
            <strong>Adresse :</strong> {formData.companyAddress}
          </p>
          <p>
            <strong>Code postal :</strong> {formData.postalCode}
          </p>
          <p>
            <strong>Ville :</strong> {formData.companyCity}
          </p>
          <p>
            <strong>Pays :</strong> {formData.companyCountry}
          </p>
          <p>
            <strong>Site web :</strong> {formData.website}
          </p>

          {formData.files.length === 0 && <p>Aucun fichier joint.</p>}
          {formData.files.length > 0 && (
            <ul>
              {formData.files.map((file, idx) => {
                // Fonction supprimer
                const handleDeleteFile = () => {
                  setFormData((prev) => ({
                    ...prev,
                    files: prev.files.filter((_, i) => i !== idx),
                  }));
                };

                // Fonction télécharger
                const handleDownloadFile = () => {
                  const url = URL.createObjectURL(file);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = file.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                };

                return (
                  <li
                    key={idx}
                    style={{
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>

                    {/* Icône Supprimer */}
                    <svg
                      onClick={handleDeleteFile}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        cursor: 'pointer',
                        width: '20px',
                        height: '20px',
                        marginRight: '15px',
                        color: 'red',
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleDeleteFile();
                      }}
                    >
                      <title>Supprimer</title>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>

                    {/* Icône Télécharger */}
                    <svg
                      onClick={handleDownloadFile}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        cursor: 'pointer',
                        width: '20px',
                        height: '20px',
                        color: 'green',
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleDownloadFile();
                      }}
                    >
                      <title>Télécharger</title>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </li>
                );
              })}
            </ul>
          )}

          <div className={styles.radioGroup}>
            <label>
              <input
                type="checkbox"
                name="declarationCertified"
                checked={formData.declarationCertified}
                onChange={handleChange}
                required
              />{' '}
              Je certifie sur l’honneur que les informations et pièces jointes fournies dans cette
              déclaration sont exactes et complètes.
            </label>
            <label>
              <input
                type="checkbox"
                name="dataProcessingConsent"
                checked={formData.dataProcessingConsent}
                onChange={handleChange}
              />{' '}
              Africa Global Logistics traite vos données uniquement afin de répondre à votre
              demande. Pour en savoir plus sur la manière dont nous traitons vos données
              personnelles et sur vos droits, cliquez ici.
            </label>
            <label>
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
              />{' '}
              Je consens par la présente à ce qu’Africa Global Logistics traite mes données
              personnelles afin de m’envoyer des offres commerciales et des informations sur nos
              services par email.
            </label>
          </div>

          <div className={styles.buttons}>
            <button type="button" onClick={goBack} className={`${styles.button} ${styles.prev}`}>
              ← Précédent
            </button>
            <button type="submit" className={`${styles.button} ${styles.submit}`}>
              Soumettre →
            </button>
          </div>
        </form>
      )}

      {step === 6 && (
        <div className={styles.thankYouContainer}>
          <p style={{ color: 'red' }}>
            <strong>Merci pour votre demande !</strong>
          </p>
          <p style={{ color: 'red' }}>
            Nous sommes ravis que vous ayez pris le temps de remplir notre formulaire de cotation.
            Notre équipe examine votre demande avec attention et reviendra vers vous très rapidement
            avec une proposition adaptée à vos besoins.
          </p>
          <p style={{ color: 'red' }}>En attendant, n’hésitez pas à parcourir notre site.</p>

          <div className={styles.buttonsContainer}>
            <button
              className={`${styles.button} ${styles.prev}`}
              onClick={() => (window.location.href = '/')}
            >
              ← Retour à l&rsquo;accueil
            </button>
            <button
              className={`${styles.button} ${styles.next}`}
              onClick={() => {
                // 🔄 Réinitialisation complète du formulaire
                setFormData({
                  transportMode: referenceData.transportModes[0],
                  incoterm: '',
                  scope: '',
                  originCountry: '',
                  originCity: '',
                  originDate: '',
                  destinationCountry: '',
                  destinationCity: '',
                  destinationDate: '',

                  QuotationType: referenceData.quotationTypes[0],
                  volume: '',
                  weight: '',
                  temperatureControlled: false,
                  dangerousGoods: false,
                  customsFormalities: false,
                  insurance: false,
                  comment: '',
                  files: [],

                  firstName: '',
                  lastName: '',
                  phoneCode: '+33',
                  phoneNumber: '',
                  email: '',
                  jobTitle: '',

                  companyName: '',
                  companyAddress: '',
                  postalCode: '',
                  companyCity: '',
                  companyCountry: '',
                  website: '',

                  declarationCertified: false,
                  dataProcessingConsent: false,
                  marketingConsent: false,
                });
                setStep(1);
              }}
            >
              Faire une autre demande
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationForm;
