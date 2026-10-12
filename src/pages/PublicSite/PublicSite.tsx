import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { PUBLIC_SITE } from "../../config/publicSite";
import { mapvisorApi } from "../../utils/mapvisorApi";
import { routeToPage } from "../../config/publicRoutes";
import type { PublicPage } from "../../config/publicRoutes";
import "./PublicSite.css";

function goToApp(path = "/app") {
  window.location.href = path;
}

function Header({ page }: { page: PublicPage }) {
  const nav = [
    { href: "/", label: "Inicio" },
    { href: "/publicar-lote", label: "Publicar" },
    { href: "/contacto", label: "Contacto" },
    { href: "/libro-reclamaciones", label: "Libro" },
  ];

  return (
    <header className="public-header">
      <a className="public-logo" href="/" aria-label="Inicio de Tupu">
        <img src="/marca/icono-slogan.png" alt="Tupu - Encuentra tu lugar" />
      </a>
      <nav className="public-nav" aria-label="Navegacion publica">
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={routeToPage[item.href] === page ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <button className="public-header-cta" type="button" onClick={() => goToApp("/app")}>
        Ingresar
      </button>
    </header>
  );
}

function Footer() {
  return (
    <footer className="public-footer">
      <div>
        <img src="/marca/icono-slogan.png" alt="Tupu - Encuentra tu lugar" />
        <p>Plataforma digital para publicar lotes, terrenos y propiedades en un mapa interactivo.</p>
      </div>
      <div className="public-footer-links">
        <a href="/terminos-y-condiciones">Terminos y condiciones</a>
        <a href="/politica-devoluciones">Cambios y devoluciones</a>
        <a href="/libro-reclamaciones">Libro de reclamaciones</a>
        <a href="/contacto">Contacto</a>
      </div>
    </footer>
  );
}

function HomePage() {
  const services = [
    {
      icon: "location_on",
      title: "Lote urbano",
      description: "Ficha publica con ubicacion, area, precio y multimedia.",
    },
    {
      icon: "agriculture",
      title: "Terreno agricola",
      description: "Publicacion geolocalizada para compradores que buscan extension y acceso.",
    },
    {
      icon: "home_work",
      title: "Casa",
      description: "Datos principales, fotos, video y punto de ubicacion en el mapa.",
    },
    {
      icon: "apartment",
      title: "Departamento",
      description: "Publicacion con descripcion clara y datos de contacto del anunciante.",
    },
    {
      icon: "domain_add",
      title: "Lote en proyecto",
      description: "Ideal para mostrar manzana, etapa, precio y estado de disponibilidad.",
    },
  ];

  return (
    <>
      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="public-kicker public-anim-one">Tu propiedad, en el mapa</p>
          <h1 className="public-hero-title">
            <span>Publica tu lote</span>
            <span>en Tupu.</span>
          </h1>
          <span className="public-slogan">Encuentra tu lugar</span>
          <p className="public-hero-description">
            Publica tu lote, terreno, casa o departamento en un mapa interactivo para que otras
            personas puedan verlo, revisar su ubicacion, fotos, descripcion y datos principales.
          </p>
          <div className="public-actions">
            <a className="public-primary-link" href="/publicar-lote">
              Publicar mi propiedad
            </a>
            <button className="public-secondary-link" type="button" onClick={() => goToApp("/app")}>
              Explorar el mapa
            </button>
          </div>
          <div className="public-hero-stats" aria-label="Resumen del servicio">
            <span><strong>Ubicación</strong> en el mapa</span>
            <span><strong>Fotos y videos</strong> de tu propiedad</span>
            <span><strong>Mapa 3D</strong> visible para compradores</span>
          </div>
        </div>
        <div className="public-hero-panel" aria-label="Resumen del plan de publicacion">
          <div className="public-panel-glow" />
          <div className="public-plan-card">
            <div className="public-plan-card-head">
              <span className="public-plan-icon" aria-hidden="true" />
              <div>
                <span>Promoción de lanzamiento</span>
                <strong>{PUBLIC_SITE.launchPrice}</strong>
              </div>
            </div>
            <p>{PUBLIC_SITE.launchMessage}</p>
            <a className="public-plan-link" href="/publicar-lote">
              Ver detalles
            </a>
          </div>
          <div className="public-flow-card">
            {[
              ["edit_location_alt", "Completa los datos"],
              ["task_alt", "Publica tu propiedad"],
              ["travel_explore", "Aparece en el mapa"],
            ].map(([icon, text]) => (
              <div className="public-flow-row" key={text}>
                <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
                <strong>{text}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-band">
        <div className="public-section-heading">
          <p className="public-kicker">Servicio ofrecido</p>
          <h2>Visibilidad para propiedades en venta o alquiler</h2>
        </div>
        <div className="public-product-grid">
          {services.map(({ icon, title, description }) => (
            <article className="public-product-card" key={title}>
              <div className="public-product-image">
                <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function PublishPage() {
  return (
    <>
      <section className="public-simple-hero">
        <p className="public-kicker">Promoción de lanzamiento</p>
        <h1>Muestra tu lote a quienes buscan su próximo lugar</h1>
        <p>
          Comparte su ubicación, fotos y características en el mapa de Tupu para que las personas
          interesadas puedan conocerlo y contactarte.
        </p>
      </section>

      <section className="public-pricing-layout">
        <article className="public-pricing-card">
          <span className="public-badge">Oferta de lanzamiento</span>
          <h2>Tu lote en el mapa</h2>
          <div className="public-price">{PUBLIC_SITE.launchPrice}<sup>*</sup></div>
          <p>Durante la promoción de lanzamiento, sin pagos ni renovaciones mensuales.</p>
          <ul>
            {[
              "Visualización en el mapa interactivo de Tupu.",
              "Ficha con precio, área, ubicación, fotos y videos.",
              "Acceso a Mis lotes para gestionar publicaciones.",
              "Contacto directo con personas interesadas.",
            ].map((item) => (
              <li key={item}>
                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button className="public-primary-link as-button" type="button" onClick={() => goToApp("/app?publicar=1")}>
            Publicar mi lote
          </button>
        </article>

        <div className="public-steps">
          <h2>Cómo publicar</h2>
          {[
            ["1", "Regístrate o inicia sesión."],
            ["2", "Completa la información del lote y sube fotos o videos."],
            ["3", "Revisa la información de tu publicación."],
            ["4", "Publica y muestra tu lote en el mapa."],
          ].map(([number, text]) => (
            <div className="public-step" key={number}>
              <span>{number}</span>
              <p>{text}</p>
            </div>
          ))}
          <p className="public-promotion-note"><small>* La promoción no tiene una fecha de finalización definida.
            Cuando finalice, los cobros serán solo por publicar. Comunicaremos las tarifas y condiciones
            antes de activarlas; cualquier contratación de pago requerirá tu aceptación, sin cobros
            automáticos ni retroactivos. Buscar y explorar lotes siempre es gratis. <a href="/terminos-y-condiciones">Ver condiciones</a>.</small></p>
        </div>
      </section>
    </>
  );
}

function TermsPage() {
  return (
    <LegalArticle title="Terminos y condiciones">
      <p>
        Estos terminos regulan el uso de {PUBLIC_SITE.brandName}, plataforma digital que permite a
        usuarios registrados publicar informacion de lotes, terrenos, casas o departamentos en un
        mapa interactivo.
      </p>
      <h2>Datos del comercio</h2>
      <p>Nombre comercial: {PUBLIC_SITE.brandName}</p>
      <p className="public-provider-details">
        Titular: {PUBLIC_SITE.legalName}<br />
        RUC: {PUBLIC_SITE.ruc}
      </p>
      <p>Direccion: {PUBLIC_SITE.address}</p>
      <p>Correo: {PUBLIC_SITE.email}</p>
      <p>Telefono: {PUBLIC_SITE.phone}</p>
      <h2>Servicio contratado</h2>
      <p>
        El servicio consiste en publicar una ficha inmobiliaria dentro de la plataforma.
        La publicacion puede incluir descripcion, precio,
        area, ubicacion aproximada o exacta, imagenes, videos y otros datos ingresados por el usuario.
      </p>
      <h2>Responsabilidad del usuario</h2>
      <p>
        El usuario declara que la informacion publicada es verdadera, que cuenta con autorizacion para
        anunciar el inmueble y que no publicara contenido falso, ofensivo, ilegal o que infrinja
        derechos de terceros.
      </p>
      <h2>Promoción gratuita y futuros cobros</h2>
      <p>
        Buscar y explorar lotes siempre es gratis. Publicar también es gratis durante la promoción
        de lanzamiento, sin pagos ni renovaciones mensuales. La promoción no tiene una fecha de
        finalización definida. Tupu comunicará su finalización y las tarifas y condiciones a los
        anunciantes antes de activar cobros, que serán exclusivamente por publicar. Cualquier
        contratación de pago requerirá la aceptación del anunciante, sin cobros automáticos ni retroactivos.
      </p>
      <h2>Suspension de publicaciones</h2>
      <p>
        Tupu puede ocultar o retirar publicaciones que incumplan estos terminos, presenten informacion
        enganosa o generen reclamos fundados de terceros.
      </p>
    </LegalArticle>
  );
}

function RefundsPage() {
  return (
    <LegalArticle title="Politica de cambios y devoluciones">
      <p>
        Publicar en {PUBLIC_SITE.brandName} es gratis durante la promoción de lanzamiento.
        Buscar y explorar lotes siempre es gratis.
      </p>
      <h2>Durante la promoción</h2>
      <p>
        Tupu no cobra por publicar durante esta etapa, por lo que no hay importes de publicación
        que devolver. Si tienes un problema con tu publicación, puedes solicitar soporte.
      </p>
      <h2>Compras de inmuebles</h2>
      <p>
        Los precios de los inmuebles pertenecen a sus anunciantes. Las condiciones de compraventa
        o alquiler se acuerdan directamente con ellos; la promoción corresponde al servicio de publicación.
      </p>
      <h2>Cambios de informacion</h2>
      <p>
        El usuario puede editar o retirar su publicación desde Mis lotes, sin costo durante la promoción.
      </p>
      <h2>Futuras publicaciones de pago</h2>
      <p>
        Antes de ofrecer publicaciones de pago, Tupu comunicará sus tarifas, duración y condiciones
        de cambios y devoluciones. Solo se cobrará a quienes acepten contratar una publicación.
      </p>
      <h2>Canal de atencion</h2>
      <p>
        Para solicitar soporte, cambios o devoluciones, escribe a {PUBLIC_SITE.email} o comunicate al
        {` ${PUBLIC_SITE.phone}`}.
      </p>
    </LegalArticle>
  );
}

function ClaimsPage() {
  const [receipt, setReceipt] = useState<{ number: string; createdAt: string; fields: Record<string, string> } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const submissionId = useRef(crypto.randomUUID());

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || receipt) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    sending.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await mapvisorApi<{ ok: boolean; claim: { number: string; createdAt: string } }>("/api/claims", {
        method: "POST",
        json: { ...fields, submissionId: submissionId.current },
      });
      setReceipt({ ...result.claim, fields });
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "No pudimos confirmar el registro."} Si necesitas ayuda, escribe a ${PUBLIC_SITE.email}.`);
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    const labels: Record<string, string> = { name: "Nombre", document: "Documento", email: "Correo", phone: "Teléfono", address: "Domicilio", guardian: "Representante (menor de edad)", service: "Servicio", type: "Tipo", amount: "Monto reclamado (S/)", detail: "Detalle", request: "Pedido" };
    const content = ["TUPU — HOJA DE RECLAMACIÓN", `Constancia: ${receipt.number}`,
      `Fecha: ${new Date(receipt.createdAt).toLocaleString("es-PE", { timeZone: "America/Lima" })} (Lima)`,
      `Marca: ${PUBLIC_SITE.brandName}`, `Titular: ${PUBLIC_SITE.legalName}`, `RUC: ${PUBLIC_SITE.ruc}`, PUBLIC_SITE.address, PUBLIC_SITE.email, PUBLIC_SITE.phone,
      ...Object.entries(labels).map(([key, label]) => `${label}: ${receipt.fields[key] || "No indicado"}`),
      "Respuesta por correo electrónico en un plazo máximo de 15 días hábiles."];
    const url = URL.createObjectURL(new Blob([content.join("\n\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.number}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="public-form-page">
      <div className="public-section-heading">
        <p className="public-kicker">Atencion al consumidor</p>
        <h1>Libro de reclamaciones</h1>
        <p>
          Formulario integrado para registrar quejas o reclamos relacionados con el servicio de
          publicacion digital de {PUBLIC_SITE.brandName}.
        </p>
      </div>

      <form className="public-claim-form" onSubmit={onSubmit}>
        <p>{PUBLIC_SITE.brandName} · {PUBLIC_SITE.address}<br />{PUBLIC_SITE.email} · {PUBLIC_SITE.phone}</p>
        <p className="public-provider-details">
          Titular: {PUBLIC_SITE.legalName}<br />
          RUC: {PUBLIC_SITE.ruc}
        </p>
        <fieldset disabled={submitting || !!receipt} className="public-claim-fields">
        <div className="public-form-grid">
          <label>
            Nombre completo *
            <input required name="name" type="text" maxLength={200} />
          </label>
          <label>
            Documento de identidad *
            <input required name="document" type="text" maxLength={30} />
          </label>
          <label>
            Correo electronico *
            <input required name="email" type="email" maxLength={254} />
          </label>
          <label>
            Telefono *
            <input required name="phone" type="tel" maxLength={30} />
          </label>
          <label>Domicilio *<input required name="address" type="text" maxLength={500} /></label>
          <label>Padre, madre o representante, si eres menor de edad<input name="guardian" type="text" maxLength={200} /></label>
          <label>Servicio relacionado *
            <select required name="service" defaultValue="publicacion">
              <option value="publicacion">Publicación de propiedades</option>
              <option value="busqueda">Búsqueda de lotes y uso del visor</option>
              <option value="otro">Otro servicio de Tupu</option>
            </select>
          </label>
          <label>
            Tipo *
            <select required name="type" defaultValue="">
              <option value="" disabled>Seleccionar</option>
              <option value="reclamo">Reclamo</option>
              <option value="queja">Queja</option>
            </select>
          </label>
          <label>
            Monto reclamado
            <input name="amount" type="number" min="0" max="999999999" step="0.01" placeholder="S/ (opcional)" />
          </label>
        </div>
        <label>
          Detalle del reclamo o queja *
          <textarea required name="detail" rows={6} maxLength={5000} />
        </label>
        <label>
          Pedido del consumidor *
          <textarea required name="request" rows={4} maxLength={5000} />
        </label>
        <p className="public-form-note">
          Guardaremos tu queja o reclamo y te entregaremos un código y una constancia descargable.
          Usaremos tus datos para atenderlo y responder por correo electrónico en un plazo máximo
          de 15 días hábiles. Reclamo: disconformidad con el servicio. Queja: malestar con la atención.
        </p>
        <button className="public-primary-link as-button" type="submit">
          {submitting ? "Registrando…" : "Enviar reclamo o queja"}
        </button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        {receipt && (
          <div className="public-form-success" role="status">
            Registro guardado. Código de constancia: <strong>{receipt.number}</strong>
            <p>Fecha: {new Date(receipt.createdAt).toLocaleString("es-PE", { timeZone: "America/Lima" })} (Lima).</p>
            <button type="button" className="public-secondary-link" onClick={downloadReceipt}>Descargar constancia</button>
          </div>
        )}
      </form>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="public-contact-page">
      <div>
        <p className="public-kicker">Contacto</p>
        <h1>Estamos para ayudarte</h1>
        <p>
          Usa estos canales para consultas sobre publicaciones, la promoción, reclamos o soporte
          tecnico de la plataforma.
        </p>
      </div>
      <div className="public-contact-list">
        <article>
          <span className="material-symbols-outlined">mail</span>
          <strong>Correo</strong>
          <a href={`mailto:${PUBLIC_SITE.email}`}>{PUBLIC_SITE.email}</a>
        </article>
        <article>
          <span className="material-symbols-outlined">call</span>
          <strong>Telefono</strong>
          <a href={`tel:${PUBLIC_SITE.phone.replace(/\s/g, "")}`}>{PUBLIC_SITE.phone}</a>
        </article>
        <article>
          <span className="material-symbols-outlined">location_on</span>
          <strong>Direccion</strong>
          <p>{PUBLIC_SITE.address}</p>
        </article>
        <article>
          <span className="material-symbols-outlined">schedule</span>
          <strong>Horario</strong>
          <p>{PUBLIC_SITE.supportHours}</p>
        </article>
      </div>
    </section>
  );
}

function LegalArticle({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="public-legal">
      <p className="public-kicker">Informacion legal</p>
      <h1>{title}</h1>
      {children}
    </article>
  );
}

export default function PublicSite({ page }: { page: PublicPage }) {
  useEffect(() => {
    document.title = "Tupu - Encuentra tu lugar";
  }, []);

  return (
    <div className="public-site-page">
      <Header page={page} />
      <main>
        {page === "home" && <HomePage />}
        {page === "publish" && <PublishPage />}
        {page === "terms" && <TermsPage />}
        {page === "refunds" && <RefundsPage />}
        {page === "claims" && <ClaimsPage />}
        {page === "contact" && <ContactPage />}
      </main>
      <Footer />
    </div>
  );
}
