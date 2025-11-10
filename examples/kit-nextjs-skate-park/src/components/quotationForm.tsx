import React, { useState, ChangeEvent, useEffect } from 'react';
import styles from '../styles/quotationForm.module.css';
import referenceData from '../data/referenceData.json';

import ReCAPTCHA from 'react-google-recaptcha';

type Lang = 'en' | 'fr';

type TransportMode = string;
type QuotationType = string;

type FormData = {
  lang: Lang; // ✅ AJOUT ICI
  transportMode: TransportMode;
  incoterm: string;
  scope: string;
  originCountry: string;
  originCity: string;
  originDate: string;
  destinationCountry: string;
  destinationCity: string;
  destinationDate: string;

  quotationType: QuotationType;
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
  vatRegistration: string;

  declarationCertified: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;

  originRegion: string; // ✅ ajouté
  destinationRegion: string; // ✅ ajouté

  originCountryCode: string; // ✅ ajouté
  destinationCountryCode: string; // ✅ ajouté

  air: boolean;
  sea: boolean;
  road: boolean;
  express: boolean;
  multimodal: boolean;
  warehousing: boolean;
};

/* ---------------------------
   Composant principal
   --------------------------- */

const QuotationForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<Lang>('en');
  const labels = referenceData.labels[lang];

  const [formData, setFormData] = useState<FormData>({
    lang: 'en', // ✅ valeur par défaut
    transportMode: '',
    incoterm: '',
    scope: '',
    originCountry: '',
    originCity: '',
    originDate: '',
    destinationCountry: '',
    destinationCity: '',
    destinationDate: '',

    quotationType: '',
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
    vatRegistration: '',

    declarationCertified: false,
    dataProcessingConsent: false,
    marketingConsent: false,

    originRegion: '', // ✅ ajouté
    destinationRegion: '', // ✅ ajouté

    originCountryCode: '', // ✅ ajouté
    destinationCountryCode: '', // ✅ ajouté

    air: false,
    sea: false,
    road: false,
    express: false,
    multimodal: false,
    warehousing: false,
  });

  const today = new Date().toISOString().split('T')[0];
  // 🔹 Ajoute cet état local pour gérer les erreurs email
  const [emailError, setEmailError] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [flowResponse, setFlowResponse] = useState<any>(null);

  // Ton useEffect pour auto-fermer le message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000); // 5 secondes
      return () => clearTimeout(timer); // Nettoyage si message change avant la fin
    }
  }, [message]);

  /* ------------------------------------------
     handleChange : gestionnaire centralisé pour
     input/select/textarea (ChangeEvent)
     ------------------------------------------ */

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
      setFormData((prev) => {
        let updates: Partial<FormData> = { [name]: value };

        if (name === 'originCountry') {
          const origin = referenceData.countries.find((c) => c.code === value);
          updates = {
            ...updates,
            originCity: '',
            originRegion: origin ? origin.region : '',
            originCountryCode: origin ? origin.code : '', // ✅ rempli automatiquement
          };
        }

        if (name === 'destinationCountry') {
          const dest = referenceData.countries.find((c) => c.code === value);
          updates = {
            ...updates,
            destinationCity: '',
            destinationRegion: dest ? dest.region : '',
            destinationCountryCode: dest ? dest.code : '', // ✅ rempli automatiquement
          };
        }

        // 🔹 Modifie ton handleChange pour inclure une vérification
        if (name === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          setEmailError(emailRegex.test(value) ? '' : 'Adresse e-mail invalide');
        }

        return { ...prev, ...updates };
      });
    }
  };

  /* -----------------------
     handleFileChange
     - récupère les fichiers choisis par l'utilisateur
     - les ajoute au tableau formData.files
     ----------------------- */

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  /* -----------------------
     fileToBase64 : convertit File -> base64 string
     - retourne uniquement la partie base64 (sans le "data:*/ /*;base64,")
     ----------------------- */

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });

  const [loading, setLoading] = useState(false);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  /* -----------------------
     handleSubmit : envoi final
     - encode les fichiers en base64
     - construit le payload et l'envoie via fetch
     ----------------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // 🔹 Efface l’ancien message
    setIsSuccess(null);

    if (!captchaToken) {
      setMessage(lang === 'fr' ? 'Veuillez valider le reCAPTCHA.' : 'Please verify the reCAPTCHA.');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    try {
      const encodedFiles = await Promise.all(
        formData.files.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          content: await fileToBase64(file),
        }))
      );

      const payload = {
        ...formData,
        originCountry: getCountryLabelForPayload(formData.originCountry, lang),
        destinationCountry: getCountryLabelForPayload(formData.destinationCountry, lang),
        companyCountry: getCountryLabelForPayload(formData.companyCountry, lang),
        files: encodedFiles,
        captchaToken,
      };

      const flowResp = await fetch(
        'https://68b60aa88dc4e791bf486048b0d517.48.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d08503b9f77f4f45a8195940da9bf41a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XB_GfZeIUjYQq0ckFXvlaMwl0s001eA02ViiI-OHWYA',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (flowResp.ok) {
        const data = await flowResp.json();
        setFlowResponse(data);
        setMessage(data.message || 'Formulaire envoyé avec succès !');
        setIsSuccess(true);
        setStep(6);
      } else {
        const errorText = await flowResp.text();
        console.error('Erreur Flow:', errorText);
        setMessage('Erreur lors de l’envoi au flux Power Automate : ' + errorText);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Erreur lors de l’envoi du formulaire :', error);
      setMessage(
        lang === 'fr'
          ? 'Une erreur est survenue lors de l’envoi du formulaire.'
          : 'An error occurred while submitting the form.'
      );
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  const getCountryName = (code: string) => {
    const country = referenceData.countries.find((c) => c.code === code);
    return country ? country[lang] : code;
  };

  const getCountryLabelForPayload = (code: string, lang: 'en' | 'fr') => {
    const country = referenceData.countries.find((c) => c.code === code);
    return country ? country[lang] : code;
  };

  {
    /* utilitaire pour afficher Oui/Non ou Yes/No */
  }
  const getYesNo = (value: boolean, lang: 'en' | 'fr') => {
    if (lang === 'fr') {
      return value ? 'Oui' : 'Non';
    }
    return value ? 'Yes' : 'No';
  };

  /* -----------------------
     Rendu JSX
     - Le formulaire est divisé en étapes (step 1..6)
     ----------------------- */

  return (
    <div className={styles.container}>
      {/* 🔹 Choix de la langue */}
      <div className={styles.languageSwitcher}>
        <button
          onClick={() => {
            setLang('en');
            setFormData((prev) => ({ ...prev, lang: 'en' })); // ✅ update aussi le formData
          }}
          disabled={lang === 'en'}
          className={`${styles.langButton} ${lang === 'en' ? styles.active : ''}`}
        >
          EN
        </button>

        <button
          onClick={() => {
            setLang('fr');
            setFormData((prev) => ({ ...prev, lang: 'fr' })); // ✅ update aussi le formData
          }}
          disabled={lang === 'fr'}
          className={`${styles.langButton} ${lang === 'fr' ? styles.active : ''}`}
        >
          FR
        </button>
      </div>

      {step !== 6 && <h1 className={styles.title}>{labels.quotation}</h1>}
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
                    referenceData.labels[lang].routingInfo,
                    referenceData.labels[lang].cargoInfo,
                    referenceData.labels[lang].contactInfo,
                    referenceData.labels[lang].companyInfo,
                    referenceData.labels[lang].synthesis,
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
          <h2 className={styles.subtitle}>Mode & Scope</h2>

          {/* Transport Mode */}
          <label className={styles.label}>{labels.transportMode} *</label>
          {/*<div className={styles.radioGroup}>
            {referenceData.transportModes[lang].map((mode) => (
              <label key={mode}>
                <input
                  type="radio"
                  name="transportMode"
                  value={mode}
                  checked={formData.transportMode === mode}
                  onChange={handleChange}
                  required
                />
                {mode}
              </label>
            ))}
          </div>*/}
          {/* Options Service Type */}
          <div className={styles.radioGroup}>
            <label className={styles.label}>
              <input type="checkbox" name="air" checked={formData.air} onChange={handleChange} />{' '}
              {labels.air}
            </label>
            <label className={styles.label}>
              <input type="checkbox" name="sea" checked={formData.sea} onChange={handleChange} />{' '}
              {labels.sea}
            </label>
            <label className={styles.label}>
              <input type="checkbox" name="road" checked={formData.road} onChange={handleChange} />{' '}
              {labels.road}
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="express"
                checked={formData.express}
                onChange={handleChange}
              />{' '}
              {labels.express}
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="multimodal"
                checked={formData.multimodal}
                onChange={handleChange}
              />{' '}
              {labels.multimodal}
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="warehousing"
                checked={formData.warehousing}
                onChange={handleChange}
              />{' '}
              {labels.warehousing}
            </label>
          </div>

          {/* Incoterm */}
          <label className={styles.label}>{labels.incoterm} </label>
          <select
            name="incoterm"
            value={formData.incoterm}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">-- {labels.select} --</option>
            {referenceData.incoterms[lang].map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          {/* Scope */}
          <label className={styles.label}>{labels.scope} *</label>
          <select
            name="scope"
            value={formData.scope}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- {labels.select} --</option>
            {referenceData.scopes[lang].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Origin */}
          <h3 className={styles.subtitle}>{labels.origin}</h3>

          <label className={styles.label}>{labels.country} *</label>
          <select
            name="originCountry"
            value={formData.originCountry}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- {labels.select} --</option>
            {referenceData.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c[lang]}
              </option>
            ))}
          </select>

          <label className={styles.label}>{labels.city} *</label>
          <input
            type="text"
            name="originCity"
            value={formData.originCity}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>{labels.startDate} *</label>
          <input
            type="date"
            name="originDate"
            value={formData.originDate}
            onChange={handleChange}
            required
            className={styles.input}
            min={today}
          />

          {/* Destination */}
          <h3 className={styles.subtitle}>{labels.destination}</h3>

          <label className={styles.label}>{labels.country} *</label>
          <select
            name="destinationCountry"
            value={formData.destinationCountry}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- {labels.select} --</option>
            {referenceData.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c[lang]}
              </option>
            ))}
          </select>

          <label className={styles.label}>{labels.city} *</label>
          <input
            type="text"
            name="destinationCity"
            value={formData.destinationCity}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label className={styles.label}>{labels.endDate} *</label>
          <input
            type="date"
            name="destinationDate"
            value={formData.destinationDate}
            onChange={handleChange}
            required
            className={styles.input}
            min={today}
          />

          <div className={styles.buttons}>
            <button
              className={`${styles.button} ${styles.prev}`}
              onClick={() => (window.location.href = '/')}
            >
              ← {labels.backToHome}
            </button>
            <button type="submit" className={`${styles.button} ${styles.next}`}>
              {labels.next}
            </button>
          </div>
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
          <h2 className={styles.subtitle}>{labels.cargoInfo}</h2>

          {/* Cargo Type */}
          <label className={styles.label}>{labels.cargoType} *</label>
          <select
            name="quotationType"
            value={formData.quotationType}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- {labels.select} --</option>
            {referenceData.quotationTypes[lang].map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          {/* Volume */}
          <label className={styles.label}>{labels.volume} *</label>
          <input
            type="number"
            name="volume"
            value={formData.volume}
            onChange={handleChange}
            required
            className={styles.input}
            min="0"
          />

          {/* Weight */}
          <label className={styles.label}>{labels.weight} *</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            className={styles.input}
            min="0"
          />

          {/* Options Cargo */}
          <div className={styles.radioGroup}>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="temperatureControlled"
                checked={formData.temperatureControlled}
                onChange={handleChange}
              />{' '}
              {labels.temperatureControlled}
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="dangerousGoods"
                checked={formData.dangerousGoods}
                onChange={handleChange}
              />{' '}
              {labels.dangerousGoods}
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="customsFormalities"
                checked={formData.customsFormalities}
                onChange={handleChange}
              />{' '}
              {labels.customsFormalities}
            </label>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="insurance"
                checked={formData.insurance}
                onChange={handleChange}
              />{' '}
              {labels.insurance}
            </label>
          </div>

          <label className={styles.label}>{labels.question}</label>

          {/* Comment */}
          <label
            className={styles.label}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {labels.comment}
            <span
              title={labels.maxcomment}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#2b3e64',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'help',
              }}
            >
              !
            </span>
          </label>
          <textarea
            name="comment"
            rows={3}
            value={formData.comment}
            onChange={handleChange}
            className={styles.textarea}
          />

          {/* File Upload */}
          <label className={styles.label}>{labels.files}</label>
          <div className={styles.uploadBox}>
            <input type="file" multiple onChange={handleFileChange} />
            <p>{labels.maxfilesize}</p>
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
              {labels.previous}
            </button>
            <button type="submit" className={`${styles.button} ${styles.next}`}>
              {labels.next}
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
          <h2 className={styles.subtitle}>{labels.contactInfo}</h2>

          {/* First Name */}
          <label className={styles.label}>{labels.firstName} *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className={styles.input}
          />

          {/* Last Name */}
          <label className={styles.label}>{labels.lastName} *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className={styles.input}
          />

          {/* Phone */}
          <label className={styles.label}>{labels.phone} *</label>
          <div className={styles.flexRow}>
            <input
              type="text"
              name="phoneCode"
              value={formData.phoneCode}
              onChange={handleChange}
              required
              className={styles.input}
              style={{ width: 80 }}
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

          {/* Email */}
          <label className={styles.label}>{labels.email} *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.input}
            style={emailError ? { borderColor: 'red' } : {}}
          />
          {emailError && <p style={{ color: 'red', fontSize: '0.9em' }}>{emailError}</p>}

          {/* Job Title */}
          <label className={styles.label}>{labels.jobTitle} *</label>
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
              {labels.previous}
            </button>
            <button type="submit" className={`${styles.button} ${styles.next}`}>
              {labels.next}
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
          <h2 className={styles.subtitle}>{labels.companyInfo}</h2>

          {/* Company Name */}
          <label className={styles.label}>{labels.companyName} *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className={styles.input}
          />

          {/* Street / Address */}
          <label className={styles.label}>{labels.address} *</label>
          <input
            type="text"
            name="companyAddress"
            value={formData.companyAddress}
            onChange={handleChange}
            required
            className={styles.input}
          />

          {/* Zip Code */}
          <label className={styles.label}>{labels.zip} *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
            className={styles.input}
          />

          {/* City */}
          <label className={styles.label}>{labels.city} *</label>
          <input
            type="text"
            name="companyCity"
            value={formData.companyCity}
            onChange={handleChange}
            required
            className={styles.input}
          />

          {/* Country */}
          <label className={styles.label}>{labels.country} *</label>
          <select
            name="companyCountry"
            value={formData.companyCountry}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">-- {labels.select} --</option>
            {referenceData.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c[lang]}
              </option>
            ))}
          </select>

          {/* Website */}
          <label className={styles.label}>{labels.website}</label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={styles.input}
          />

          {/* VAT registration number */}
          <label className={styles.label}>{labels.vatRegistration} *</label>
          <input
            type="text"
            name="vatRegistration"
            value={formData.vatRegistration}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <div className={styles.buttons}>
            <button type="button" onClick={goBack} className={`${styles.button} ${styles.prev}`}>
              {labels.previous}
            </button>
            <button type="submit" className={`${styles.button} ${styles.next}`}>
              {labels.next}
            </button>
          </div>
        </form>
      )}

      {/* === ÉTAPE 5 : SYNTHÈSE === */}
      {step === 5 && (
        <form onSubmit={handleSubmit}>
          {/* ROUTING / ACHÈMINEMENT */}
          <h3 className={styles.subtitle}>{labels.routingInfo}</h3>
          <p>
            <strong>{labels.transportMode}:</strong>
          </p>
          <p>
            <strong>{labels.air}:</strong> {getYesNo(formData.air, lang)}
          </p>
          <p>
            <strong>{labels.sea}:</strong> {getYesNo(formData.sea, lang)}
          </p>
          <p>
            <strong>{labels.road}:</strong> {getYesNo(formData.road, lang)}
          </p>
          <p>
            <strong>{labels.express}:</strong> {getYesNo(formData.express, lang)}
          </p>
          <p>
            <strong>{labels.multimodal}:</strong> {getYesNo(formData.multimodal, lang)}
          </p>
          <p>
            <strong>{labels.warehousing}:</strong> {getYesNo(formData.warehousing, lang)}
          </p>
          <p>
            <strong>{labels.incoterm}:</strong> {formData.incoterm}
          </p>
          <p>
            <strong>{labels.scope}:</strong> {formData.scope}
          </p>
          <p>
            <strong>{labels.origin}:</strong> {formData.originCity},{' '}
            {getCountryName(formData.originCountry)} – {formData.originDate}
          </p>
          <p>
            <strong>{labels.destination}:</strong> {formData.destinationCity},{' '}
            {getCountryName(formData.destinationCountry)} – {formData.destinationDate}
          </p>

          {/* CARGO / CARGAISON */}
          <h3 className={styles.subtitle}>{labels.cargoInfo}</h3>
          <p>
            <strong>{labels.cargoType}:</strong> {formData.quotationType}
          </p>
          <p>
            <strong>{labels.volume}:</strong> {formData.volume} CBM
          </p>
          <p>
            <strong>{labels.weight}:</strong> {formData.weight} KG
          </p>
          <p>
            <strong>{labels.temperatureControlled}:</strong>{' '}
            {getYesNo(formData.temperatureControlled, lang)}
          </p>
          <p>
            <strong>{labels.dangerousGoods}:</strong> {getYesNo(formData.dangerousGoods, lang)}
          </p>
          <p>
            <strong>{labels.customsFormalities}:</strong>{' '}
            {getYesNo(formData.customsFormalities, lang)}
          </p>
          <p>
            <strong>{labels.insurance}:</strong> {getYesNo(formData.insurance, lang)}
          </p>
          {formData.comment && (
            <p>
              <strong>{labels.comment}:</strong> {formData.comment}
            </p>
          )}

          {/* CONTACT INFORMATION */}
          <h3 className={styles.subtitle}>{labels.contactInfo}</h3>
          <p>
            <strong>
              {labels.lastName} & {labels.firstName}:
            </strong>{' '}
            {formData.firstName} {formData.lastName}
          </p>
          <p>
            <strong>{labels.email}:</strong> {formData.email}
          </p>
          <p>
            <strong>{labels.phone}:</strong> {formData.phoneCode} {formData.phoneNumber}
          </p>
          <p>
            <strong>{labels.jobTitle}:</strong> {formData.jobTitle}
          </p>

          {/* COMPANY INFORMATION */}
          <h3 className={styles.subtitle}>{labels.companyInfo}</h3>
          <p>
            <strong>{labels.companyName}:</strong> {formData.companyName}
          </p>
          <p>
            <strong>{labels.address}:</strong> {formData.companyAddress}
          </p>
          <p>
            <strong>{labels.zip}:</strong> {formData.postalCode}
          </p>
          <p>
            <strong>{labels.city}:</strong> {formData.companyCity}
          </p>
          <p>
            <strong>{labels.country}:</strong> {getCountryName(formData.companyCountry)}
          </p>
          <p>
            <strong>{labels.website}:</strong> {formData.website || '-'}
          </p>
          <p>
            <strong>{labels.vatRegistration}:</strong> {formData.vatRegistration}
          </p>

          {/* FILES / DOCUMENTS */}
          <h3 className={styles.subtitle}>{labels.files}</h3>
          {formData.files.length === 0 && <p>Aucun fichier joint.</p>}
          {formData.files.length > 0 && (
            <ul>
              {formData.files.map((file, idx) => {
                const handleDeleteFile = () => {
                  setFormData((prev) => ({
                    ...prev,
                    files: prev.files.filter((_, i) => i !== idx),
                  }));
                };

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
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>

                    {/* Icône Corbeille */}
                    <button
                      type="button"
                      onClick={handleDeleteFile}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        marginRight: '10px',
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: '20px', height: '20px', color: 'red' }}
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>

                    {/* Icône Télécharger */}
                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          width: '20px',
                          height: '20px',
                          color: 'green',
                        }}
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* CONSENT / DECLARATION */}
          <div className={styles.radioGroup}>
            <label>
              <input
                type="checkbox"
                name="declarationCertified"
                checked={formData.declarationCertified}
                onChange={handleChange}
                required
              />{' '}
              {labels.declaration}
            </label>
            <label>
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
              />{' '}
              {labels.marketingConsent}
            </label>
            <label>
              {(() => {
                // Séparer le texte avant et après "cliquez ici / click here"
                const textParts = labels.dataProcessingConsent.split(
                  lang === 'fr' ? 'cliquez ici' : 'click here'
                );
                return (
                  <>
                    {textParts[0]}
                    <a
                      href={
                        lang === 'fr'
                          ? 'https://www.aglgroup.com/politique-de-confidentialite/'
                          : 'https://www.aglgroup.com/en/privacy-policy/'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lang === 'fr' ? 'cliquez ici' : 'click here'}
                    </a>
                    {textParts[1]}
                  </>
                );
              })()}
            </label>
          </div>

          <ReCAPTCHA
            sitekey="6LdRgAUsAAAAALFUzcwOJEU0YhhVDYuwnNgMaGJQ"
            onChange={(token: React.SetStateAction<string | null>) => setCaptchaToken(token)}
          />

          <div className={styles.buttons}>
            <button type="button" onClick={goBack} className={`${styles.button} ${styles.prev}`}>
              {labels.previous}
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submit}`}
              disabled={loading}
            >
              {loading ? <div className={styles.spinner}></div> : 'Submit →'}
            </button>
          </div>
        </form>
      )}

      {message && (
        <div
          style={{
            marginTop: '1rem',
            padding: '10px 15px',
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            border: `1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'}`,
            position: 'relative',
          }}
        >
          {/* Croix pour fermer le message */}
          <span
            onClick={() => setMessage('')}
            style={{
              position: 'absolute',
              top: '5px',
              right: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ×
          </span>

          {message}
        </div>
      )}

      {step === 6 && (
        <div className={styles.thankYouContainer}>
          <h2 className={styles.subtitle}>
            <strong>{labels.thankYouTitle}</strong>
          </h2>
          <p>{labels.thankYouMessage}</p>

          <div className={styles.buttonsContainer}>
            {/* Retour à l'accueil */}
            <button
              className={`${styles.button} ${styles.prev}`}
              onClick={() => (window.location.href = '/')}
            >
              ← {labels.backToHome}
            </button>

            {/* Envoyer une nouvelle demande */}
            <button
              className={`${styles.button} ${styles.next}`}
              onClick={() => {
                // 🔄 Réinitialisation complète du formulaire
                setFormData({
                  lang: 'en',
                  transportMode: '',
                  incoterm: '',
                  scope: '',
                  originCountry: '',
                  originCity: '',
                  originDate: '',
                  destinationCountry: '',
                  destinationCity: '',
                  destinationDate: '',

                  quotationType: '',
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
                  vatRegistration: '',

                  declarationCertified: false,
                  dataProcessingConsent: false,
                  marketingConsent: false,

                  originRegion: '',
                  destinationRegion: '',

                  originCountryCode: '',
                  destinationCountryCode: '',

                  air: false,
                  sea: false,
                  road: false,
                  express: false,
                  multimodal: false,
                  warehousing: false,
                });
                setStep(1);
              }}
            >
              {labels.sendAnotherRequest}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationForm;
