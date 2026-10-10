import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { PUBLIC_SITE } from "../../config/publicSite";
import "./PublicSite.css";

type PublicPage =
  | "home"
  | "publish"
  | "terms"
  | "refunds"
  | "claims"
  | "contact";

const routeToPage: Record<string, PublicPage> = {
  "/": "home",
  "/publicar-lote": "publish",
  "/planes": "publish",
  "/terminos-y-condiciones": "terms",
  "/politica-devoluciones": "refunds",
  "/libro-reclamaciones": "claims",
  "/contacto": "contact",
};

export function getPublicPageFromPath(pathname: string): PublicPage | null {
  return routeToPage[pathname] ?? null;
}

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
      price: "S/ 5.00",
    },
    {
      icon: "agriculture",
      title: "Terreno agricola",
      description: "Publicacion geolocalizada para compradores que buscan extension y acceso.",
      price: "S/ 5.00",
    },
    {
      icon: "home_work",
      title: "Casa",
      description: "Datos principales, fotos, video y punto de ubicacion en el mapa.",
      price: "S/ 5.00",
    },
    {
      icon: "apartment",
      title: "Departamento",
      description: "Publicacion con descripcion clara y datos de contacto del anunciante.",
      price: "S/ 5.00",
    },
    {
      icon: "domain_add",
      title: "Lote en proyecto",
      description: "Ideal para mostrar manzana, etapa, precio y estado de disponibilidad.",
      price: "S/ 5.00",
    },
  ];

  return (
    <>
      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="public-kicker public-anim-one">Publicacion inmobiliaria geolocalizada</p>
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
              Ver plan de publicacion
            </a>
            <button className="public-secondary-link" type="button" onClick={() => goToApp("/app")}>
              Explorar el mapa
            </button>
          </div>
          <div className="public-hero-stats" aria-label="Resumen del servicio">
            <span><strong>{PUBLIC_SITE.launchPrice}</strong> lanzamiento</span>
            <span><strong>30 dias</strong> por publicacion</span>
            <span><strong>Mapa 3D</strong> visible para compradores</span>
          </div>
        </div>
        <div className="public-hero-panel" aria-label="Resumen del plan de publicacion">
          <div className="public-panel-glow" />
          <div className="public-plan-card">
            <div className="public-plan-card-head">
              <span className="public-plan-icon" aria-hidden="true" />
              <div>
                <span>Plan lanzamiento</span>
                <strong>{PUBLIC_SITE.launchPrice}</strong>
              </div>
            </div>
            <p>Publicacion activa durante {PUBLIC_SITE.publicationDuration} por cada lote.</p>
            <a className="public-plan-link" href="/publicar-lote">
              Ver detalles
            </a>
          </div>
          <div className="public-flow-card">
            {[
              ["edit_location_alt", "Completa los datos"],
              ["payments", "Paga la publicacion"],
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
          {services.map(({ icon, title, description, price }) => (
            <article className="public-product-card" key={title}>
              <div className="public-product-image">
                <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <strong>{price} por 30 dias</strong>
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
        <p className="public-kicker">Plan de lanzamiento</p>
        <h1>Publica un lote por {PUBLIC_SITE.launchPrice} al mes</h1>
        <p>
          Cada pago activa la publicacion de un lote durante {PUBLIC_SITE.publicationDuration}.
          Al finalizar el periodo, el usuario podra renovar para mantenerlo visible en el mapa.
        </p>
      </section>

      <section className="public-pricing-layout">
        <article className="public-pricing-card">
          <span className="public-badge">Oferta de lanzamiento</span>
          <h2>Publicacion mensual</h2>
          <div className="public-price">{PUBLIC_SITE.launchPrice}</div>
          <p>Precio regular planificado: {PUBLIC_SITE.futurePrice} por lote publicado.</p>
          <ul>
            {[
              "Duracion de 30 dias por lote.",
              "Visualizacion en el mapa interactivo de Tupu.",
              "Ficha con precio, area, ubicacion, fotos y videos.",
              "Acceso a Mis lotes para gestionar publicaciones.",
              "Renovacion mensual para mantener la publicacion visible.",
            ].map((item) => (
              <li key={item}>
                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button className="public-primary-link as-button" type="button" onClick={() => goToApp("/app?publicar=1")}>
            Comprar publicacion
          </button>
        </article>

        <div className="public-steps">
          <h2>Proceso de compra</h2>
          {[
            ["1", "Registrate o inicia sesion."],
            ["2", "Completa la informacion del lote y sube multimedia."],
            ["3", "Revisa el resumen de publicacion."],
            ["4", "Paga con Culqi cuando la pasarela este habilitada."],
            ["5", "Tu lote queda publicado por 30 dias."],
          ].map(([number, text]) => (
            <div className="public-step" key={number}>
              <span>{number}</span>
              <p>{text}</p>
            </div>
          ))}
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
      <p>Razon social o titular: {PUBLIC_SITE.legalName}</p>
      <p>RUC: {PUBLIC_SITE.ruc}</p>
      <p>Direccion: {PUBLIC_SITE.address}</p>
      <p>Correo: {PUBLIC_SITE.email}</p>
      <p>Telefono: {PUBLIC_SITE.phone}</p>
      <h2>Servicio contratado</h2>
      <p>
        El servicio consiste en publicar una ficha inmobiliaria dentro de la plataforma durante
        {` ${PUBLIC_SITE.publicationDuration}`}. La publicacion puede incluir descripcion, precio,
        area, ubicacion aproximada o exacta, imagenes, videos y otros datos ingresados por el usuario.
      </p>
      <h2>Responsabilidad del usuario</h2>
      <p>
        El usuario declara que la informacion publicada es verdadera, que cuenta con autorizacion para
        anunciar el inmueble y que no publicara contenido falso, ofensivo, ilegal o que infrinja
        derechos de terceros.
      </p>
      <h2>Pago y activacion</h2>
      <p>
        La publicacion se activa despues de confirmarse el pago. El precio de lanzamiento es
        {` ${PUBLIC_SITE.launchPrice}`} por lote durante {PUBLIC_SITE.publicationDuration}. Tupu podra
        actualizar sus precios, informandolos antes de nuevas compras o renovaciones.
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
        El servicio vendido por {PUBLIC_SITE.brandName} es una publicacion digital mensual de lotes o
        propiedades dentro de la plataforma.
      </p>
      <h2>Antes de la activacion</h2>
      <p>
        Si el pago fue realizado pero la publicacion aun no fue activada por un error tecnico, el
        usuario puede solicitar la activacion manual o la devolucion del importe pagado.
      </p>
      <h2>Despues de la activacion</h2>
      <p>
        Una vez que el lote queda publicado, el servicio se considera iniciado. Las devoluciones se
        evaluaran cuando exista un error atribuible a la plataforma que impida mostrar la publicacion
        durante un periodo razonable.
      </p>
      <h2>Cambios de informacion</h2>
      <p>
        El usuario puede editar datos de su lote desde su cuenta. Los cambios no reinician el periodo
        de vigencia de la publicacion.
      </p>
      <h2>Renovaciones</h2>
      <p>
        Cada renovacion corresponde a un nuevo periodo de {PUBLIC_SITE.publicationDuration}. Si el
        usuario no renueva, la publicacion podra dejar de mostrarse publicamente.
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
  const [sent, setSent] = useState(false);
  const claimNumber = useMemo(() => `TUPU-${Date.now().toString().slice(-8)}`, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
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
        <div className="public-form-grid">
          <label>
            Nombre completo *
            <input required name="name" type="text" />
          </label>
          <label>
            Documento de identidad *
            <input required name="document" type="text" />
          </label>
          <label>
            Correo electronico *
            <input required name="email" type="email" />
          </label>
          <label>
            Telefono *
            <input required name="phone" type="tel" />
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
            <input name="amount" type="text" placeholder="Ej: S/ 5.00" />
          </label>
        </div>
        <label>
          Detalle del reclamo o queja *
          <textarea required name="detail" rows={6} />
        </label>
        <label>
          Pedido del consumidor *
          <textarea required name="request" rows={4} />
        </label>
        <p className="public-form-note">
          Al enviar este formulario se genera una constancia en pantalla. Para produccion, este
          registro debe conectarse al backend de Tupu para almacenamiento y atencion formal.
        </p>
        <button className="public-primary-link as-button" type="submit">
          Enviar reclamo
        </button>
        {sent && (
          <div className="public-form-success" role="status">
            Reclamo registrado. Codigo de constancia: <strong>{claimNumber}</strong>
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
          Usa estos canales para consultas sobre publicaciones, pagos, renovaciones, reclamos o soporte
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
