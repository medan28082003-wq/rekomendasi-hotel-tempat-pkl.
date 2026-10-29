import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVLOtGbvjM4IyZfZlIm5GEY2_1r1V_ZVM",
  authDomain: "pklpro.firebaseapp.com",
  projectId: "pklpro",
  storageBucket: "pklpro.firebasestorage.app",
  messagingSenderId: "254183560694",
  appId: "1:254183560694:web:95f524e091e123d3aee3d7",
};
const ADMIN_EMAIL = "medan28082003@gmail.com";
const $ = (id) => document.getElementById(id);
const demoHotels = [
  {
    id: "demo1",
    name: "Hotel Contoh Medan 1",
    city: "Medan",
    fields: "Housekeeping, Front Office",
    address: "Medan, Sumatera Utara",
    contact: "",
    website: "",
    notes: "Data contoh — verifikasi langsung ke hotel.",
  },
  {
    id: "demo2",
    name: "Hotel Contoh Medan 2",
    city: "Medan",
    fields: "Food & Beverage, Kitchen",
    address: "Medan, Sumatera Utara",
    contact: "",
    website: "",
    notes: "Data contoh — verifikasi langsung ke hotel.",
  },
  {
    id: "demo3",
    name: "Hotel Contoh Yogyakarta",
    city: "Yogyakarta",
    fields: "Front Office, Administrasi",
    address: "Yogyakarta",
    contact: "",
    website: "",
    notes: "Data contoh — verifikasi langsung ke hotel.",
  },
];
let app,
  auth,
  db,
  currentUser = null,
  isAdmin = false,
  hotels = [],
  applications = [],
  announcements = [];
const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

function toast(message) {
  const t = $("toast");
  if (!t) return;
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}
function esc(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}
function safeUrl(s = "") {
  try {
    const u = new URL(s);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
function status(id, msg) {
  if ($(id)) $(id).textContent = msg;
}
function dateText(v) {
  return v?.toDate
    ? v.toDate().toLocaleString("id-ID")
    : "Waktu belum tersedia";
}

function addFeatureUI() {
  if (!$("publicAnnouncements")) {
    const s = document.createElement("section");
    s.id = "publicAnnouncements";
    s.className = "section";
    s.innerHTML =
      '<div class="section-heading"><div><span class="eyebrow">INFO TERBARU</span><h2>Pengumuman</h2><p>Informasi dari pengelola website.</p></div></div><div id="announcementPublicList" class="announcement-grid"><p class="muted">Memuat pengumuman…</p></div>';
    $("daftar")?.parentNode.insertBefore(s, $("daftar"));
  }
  if (!$("extraAdminTools")) {
    const s = document.createElement("section");
    s.id = "extraAdminTools";
    s.className = "admin-extra";
    s.innerHTML = ` <div class="admin-columns"> <form id="announcementForm" class="apply-form admin-form"> <h3>Pengumuman publik</h3><input type="hidden" name="id"> <label>Judul<input name="title" required maxlength="120"></label> <label>Isi pengumuman<textarea name="body" required rows="4" maxlength="2000"></textarea></label> <label class="check-label"><input name="published" type="checkbox"> Terbitkan untuk pengunjung</label> <div class="inline-actions"><button class="button button-primary" type="submit">Simpan pengumuman</button><button class="button button-outline" type="button" id="cancelAnnouncement">Batal edit</button></div> <p id="announcementStatus" class="form-status" role="status"></p><div id="adminAnnouncementList" class="application-list"></div> </form> <div class="apply-form admin-form"> <h3>Catatan pribadi admin</h3><p class="muted">Hanya pemilik yang dapat membaca catatan ini.</p> <label>Catatan pribadi<textarea id="privateNotes" rows="5" maxlength="10000" placeholder="Pengingat dan tenggat pribadi…"></textarea></label> <button class="button button-primary" type="button" id="savePrivateNotes">Simpan catatan pribadi</button><p id="privateNotesStatus" class="form-status"></p> <label>Status pengelolaan website/PKL<textarea id="siteNotes" rows="5" maxlength="10000" placeholder="Tugas website, tindak lanjut hotel, status PKL…"></textarea></label> <button class="button button-primary" type="button" id="saveSiteNotes">Simpan status pengelolaan</button><p id="siteNotesStatus" class="form-status"></p> </div> </div>`;
    $("adminPanel")?.appendChild(s);
    $("announcementForm").addEventListener("submit", saveAnnouncement);
    $("cancelAnnouncement").addEventListener("click", () => {
      $("announcementForm").reset();
      $("announcementForm").elements.id.value = "";
      status("announcementStatus", "Mode tambah pengumuman.");
    });
    $("savePrivateNotes").addEventListener("click", () =>
      saveAdminNotes("privateNotes")
    );
    $("saveSiteNotes").addEventListener("click", () =>
      saveAdminNotes("siteNotes")
    );
  }
}

function renderHotels() {
  const term = $("searchInput").value.trim().toLowerCase(),
    city = $("cityFilter").value;
  const list = hotels.filter(
    (h) =>
      (!city || h.city === city) &&
      [h.name, h.city, h.fields, h.address]
        .join(" ")
        .toLowerCase()
        .includes(term)
  );
  $("hotelGrid").innerHTML = list.length
    ? list
        .map(
          (h) =>
            `<article class="hotel-card"><div class="hotel-cover" aria-hidden="true">⌂</div><div class="hotel-body"><span class="tag">${esc( h.city || "Lokasi belum diisi" )}</span><h3>${esc(h.name)}</h3><p class="hotel-city">📍 ${esc( h.city )}</p><p class="hotel-fields"><b>Bidang PKL</b><br>${esc( h.fields || "Konfirmasi ke hotel" )}</p><p class="hotel-address">${esc( h.address || "Alamat belum tersedia" )}</p>${ h.notes ? `<p class="small-note">${esc(h.notes)}</p>` : "" }<div class="hotel-actions"><button class="button button-primary apply-hotel" data-id="${esc( h.id )}">Pilih hotel</button>${ safeUrl(h.website) ? `<a class="button button-outline" href="${esc( safeUrl(h.website) )}" target="_blank" rel="noopener noreferrer">Situs resmi ↗</a>` : "" }</div></div></article>`
        )
        .join("")
    : '<p class="muted">Belum ada hotel yang cocok. Coba kata kunci lain.</p>';
  $("applyHotel").innerHTML =
    '<option value="">Pilih hotel…</option>' +
    hotels
      .map(
        (h) =>
          `<option value="${esc(h.id)}">${esc(h.name)} — ${esc( h.city )}</option>`
      )
      .join("");
  document.querySelectorAll(".apply-hotel").forEach((b) =>
    b.addEventListener("click", () => {
      if (!currentUser) {
        toast("Login dengan Google terlebih dahulu.");
        $("loginBtn").focus();
        return;
      }
      $("applySection").classList.remove("hidden");
      $("applyHotel").value = b.dataset.id;
      $("applySection").scrollIntoView({ behavior: "smooth" });
    })
  );
  renderAdminHotels();
}
function renderAdminHotels() {
  const saved = hotels.filter((h) => !String(h.id).startsWith("demo"));
  $("adminHotelList").innerHTML =
    saved
      .map(
        (h) =>
          `<div class="admin-hotel-row"><div><b>${esc(h.name)}</b><small>${esc( h.city )} · ${esc( h.fields )}</small></div><div class="inline-actions"><button class="edit-btn" data-edit-hotel="${esc( h.id )}">Edit</button><button class="delete-btn" data-delete-hotel="${esc( h.id )}">Hapus</button></div></div>`
      )
      .join("") ||
    '<p class="muted">Belum ada hotel tersimpan di database.</p>';
  document.querySelectorAll("[data-edit-hotel]").forEach((b) =>
    b.addEventListener("click", () => {
      const h = hotels.find((x) => x.id === b.dataset.editHotel);
      if (!h) return;
      const f = $("hotelForm");
      [
        "name",
        "city",
        "fields",
        "address",
        "contact",
        "website",
        "notes",
      ].forEach((k) => (f.elements[k].value = h[k] || ""));
      f.dataset.editId = h.id;
      f.querySelector('button[type="submit"]').textContent = "Simpan perubahan";
      f.scrollIntoView({ behavior: "smooth", block: "center" });
    })
  );
  document.querySelectorAll("[data-delete-hotel]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!isAdmin || !confirm("Hapus rekomendasi hotel ini?")) return;
      try {
        await deleteDoc(doc(db, "hotels", b.dataset.deleteHotel));
        await loadHotels();
        toast("Hotel dihapus.");
      } catch (e) {
        console.error(e);
        toast("Gagal menghapus. Periksa Firestore Rules.");
      }
    })
  );
}
function renderApplications() {
  $("appCount").textContent = applications.length;
  $("applicationList").innerHTML = applications.length
    ? applications
        .map(
          (a) =>
            `<article class="application-card"><b>${esc( a.name )}</b><small>${esc(a.email)} · ${esc(a.school)} · ${esc( a.major )}</small><p><b>Hotel:</b> ${esc(a.hotelName || a.hotelId)}</p>${ a.message ? `<p>${esc(a.message)}</p>` : "" }<small>${dateText( a.createdAt )}</small><div class="application-admin-fields"><label>Status<select data-app-status="${esc( a.id )}"><option value="Menunggu" ${ (a.status || "Menunggu") === "Menunggu" ? "selected" : "" }>Menunggu</option><option value="Diterima" ${ a.status === "Diterima" ? "selected" : "" }>Diterima</option><option value="Ditolak" ${ a.status === "Ditolak" ? "selected" : "" }>Ditolak</option></select></label><label>Catatan admin<textarea data-app-note="${esc( a.id )}" rows="2" maxlength="2000" placeholder="Catatan internal">${esc( a.adminNote || "" )}</textarea></label><button class="button button-primary" data-save-app="${esc( a.id )}">Simpan status & catatan</button></div></article>`
        )
        .join("")
    : '<p class="muted">Belum ada pendaftar.</p>';
  document.querySelectorAll("[data-save-app]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!isAdmin) return;
      const id = b.dataset.saveApp;
      const st = document.querySelector(
        `[data-app-status="${CSS.escape(id)}"]`
      ).value;
      const note = document.querySelector(
        `[data-app-note="${CSS.escape(id)}"]`
      ).value;
      try {
        await updateDoc(doc(db, "applications", id), {
          status: st,
          adminNote: note,
          updatedAt: serverTimestamp(),
        });
        const a = applications.find((x) => x.id === id);
        if (a) {
          a.status = st;
          a.adminNote = note;
        }
        toast("Status dan catatan disimpan.");
      } catch (e) {
        console.error(e);
        toast("Gagal menyimpan. Periksa Firestore Rules.");
      }
    })
  );
}
async function loadHotels() {
  if (!db) {
    hotels = demoHotels;
    renderHotels();
    return;
  }
  try {
    const snap = await getDocs(
      query(collection(db, "hotels"), orderBy("name"))
    );
    hotels = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderHotels();
  } catch (e) {
    console.error(e);
    hotels = demoHotels;
    renderHotels();
    toast("Data hotel belum dapat dimuat. Periksa konfigurasi Firebase.");
  }
}
async function loadApplications() {
  if (!isAdmin) return;
  try {
    const snap = await getDocs(
      query(collection(db, "applications"), orderBy("createdAt", "desc"))
    );
    applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderApplications();
  } catch (e) {
    console.error(e);
    toast("Data pendaftar gagal dimuat. Periksa Firestore Rules.");
  }
}
async function loadAnnouncements() {
  if (!db) return;
  try {
    const q = isAdmin
      ? query(collection(db, "announcements"), orderBy("updatedAt", "desc"))
      : query(
          collection(db, "announcements"),
          where("published", "==", true),
          orderBy("updatedAt", "desc")
        );
    const snap = await getDocs(q);
    announcements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    $("announcementPublicList").innerHTML =
      announcements
        .filter((a) => a.published)
        .map(
          (a) =>
            `<article class="announcement-card"><span class="tag">Pengumuman</span><h3>${esc( a.title )}</h3><p>${esc(a.body).replace( /\n/g, "<br>" )}</p><small>${dateText( a.updatedAt || a.createdAt )}</small></article>`
        )
        .join("") ||
      '<p class="muted">Belum ada pengumuman yang diterbitkan.</p>';
    if (isAdmin) renderAdminAnnouncements();
  } catch (e) {
    console.error(e);
    $("announcementPublicList").innerHTML =
      '<p class="muted">Pengumuman belum dapat dimuat.</p>';
    toast("Gagal memuat pengumuman. Periksa Rules/index.");
  }
}
function renderAdminAnnouncements() {
  $("adminAnnouncementList").innerHTML =
    announcements
      .map(
        (a) =>
          `<article class="application-card"><b>${esc(a.title)}</b><small>${ a.published ? "Sudah diterbitkan" : "Draf — tidak terlihat publik" }</small><p>${esc( a.body )}</p><div class="inline-actions"><button class="edit-btn" data-edit-ann="${esc( a.id )}">Edit</button><button class="delete-btn" data-delete-ann="${esc( a.id )}">Hapus</button></div></article>`
      )
      .join("") || '<p class="muted">Belum ada pengumuman.</p>';
  document.querySelectorAll("[data-edit-ann]").forEach((b) =>
    b.addEventListener("click", () => {
      const a = announcements.find((x) => x.id === b.dataset.editAnn),
        f = $("announcementForm");
      if (!a) return;
      f.elements.id.value = a.id;
      f.elements.title.value = a.title || "";
      f.elements.body.value = a.body || "";
      f.elements.published.checked = !!a.published;
      f.scrollIntoView({ behavior: "smooth", block: "center" });
    })
  );
  document.querySelectorAll("[data-delete-ann]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus pengumuman ini?")) return;
      try {
        await deleteDoc(doc(db, "announcements", b.dataset.deleteAnn));
        await loadAnnouncements();
        toast("Pengumuman dihapus.");
      } catch (e) {
        console.error(e);
        toast("Gagal menghapus pengumuman.");
      }
    })
  );
}
async function loadAdminNotes() {
  if (!isAdmin) return;
  try {
    const s = await getDoc(doc(db, "adminPrivate", "main"));
    if (s.exists()) {
      const d = s.data();
      $("privateNotes").value = d.privateNotes || "";
      $("siteNotes").value = d.siteNotes || "";
    }
  } catch (e) {
    console.error(e);
    toast("Catatan admin gagal dimuat.");
  }
}
async function saveAnnouncement(e) {
  e.preventDefault();
  if (!isAdmin) return;
  const f = e.currentTarget,
    id = f.elements.id.value;
  const data = {
    title: f.elements.title.value.trim(),
    body: f.elements.body.value.trim(),
    published: f.elements.published.checked,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.email || "",
  };
  status("announcementStatus", "Menyimpan…");
  try {
    if (id) await updateDoc(doc(db, "announcements", id), data);
    else
      await addDoc(collection(db, "announcements"), {
        ...data,
        createdAt: serverTimestamp(),
      });
    f.reset();
    f.elements.id.value = "";
    status("announcementStatus", "Pengumuman tersimpan.");
    await loadAnnouncements();
    toast("Pengumuman tersimpan.");
  } catch (e) {
    console.error(e);
    status("announcementStatus", "Gagal menyimpan. Periksa Firestore Rules.");
  }
}
async function saveAdminNotes(field) {
  if (!isAdmin) return;
  const value = $(field).value;
  const msg =
    field === "privateNotes" ? "privateNotesStatus" : "siteNotesStatus";
  status(msg, "Menyimpan…");
  try {
    await setDoc(
      doc(db, "adminPrivate", "main"),
      {
        [field]: value,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.email || "",
      },
      { merge: true }
    );
    status(msg, "Berhasil disimpan.");
    toast("Catatan tersimpan.");
  } catch (e) {
    console.error(e);
    status(msg, "Gagal menyimpan. Periksa Firestore Rules.");
  }
}
async function login() {
  if (!auth) {
    toast("Firebase belum siap.");
    return;
  }
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    console.error(e);
    toast(
      e.code === "auth/popup-closed-by-user"
        ? "Login dibatalkan."
        : "Login gagal. Periksa domain dan konfigurasi Google."
    );
  }
}
async function saveApplication(e) {
  e.preventDefault();
  if (!currentUser) {
    toast("Login Google terlebih dahulu.");
    return;
  }
  const f = new FormData(e.currentTarget),
    hotel = hotels.find((h) => h.id === f.get("hotel"));
  if (!hotel) {
    status("applyStatus", "Pilih hotel yang tersedia.");
    return;
  }
  status("applyStatus", "Mengirim…");
  try {
    await addDoc(collection(db, "applications"), {
      uid: currentUser.uid,
      email: currentUser.email || "",
      name: String(f.get("name")).trim(),
      school: String(f.get("school")).trim(),
      major: String(f.get("major")).trim(),
      hotelId: hotel.id,
      hotelName: hotel.name,
      message: String(f.get("message") || "").trim(),
      status: "Menunggu",
      adminNote: "",
      createdAt: serverTimestamp(),
    });
    e.currentTarget.reset();
    status(
      "applyStatus",
      "Berhasil dikirim. Pemilik website akan meninjau data ini."
    );
    toast("Minat PKL berhasil dikirim.");
  } catch (e) {
    console.error(e);
    status(
      "applyStatus",
      "Gagal mengirim. Periksa konfigurasi dan aturan database."
    );
  }
}
async function saveHotel(e) {
  e.preventDefault();
  if (!isAdmin) return;
  const f = e.currentTarget,
    id = f.dataset.editId;
  const data = {
    name: f.elements.name.value.trim(),
    city: f.elements.city.value.trim(),
    fields: f.elements.fields.value.trim(),
    address: f.elements.address.value.trim(),
    contact: f.elements.contact.value.trim(),
    website: safeUrl(f.elements.website.value.trim()),
    notes: f.elements.notes.value.trim(),
    updatedAt: serverTimestamp(),
  };
  status("hotelStatus", "Menyimpan…");
  try {
    if (id) await updateDoc(doc(db, "hotels", id), data);
    else
      await addDoc(collection(db, "hotels"), {
        ...data,
        createdAt: serverTimestamp(),
      });
    f.reset();
    delete f.dataset.editId;
    f.querySelector('button[type="submit"]').textContent = "Simpan hotel";
    status(
      "hotelStatus",
      id ? "Perubahan hotel disimpan." : "Hotel berhasil ditambahkan."
    );
    await loadHotels();
    toast("Data hotel tersimpan.");
  } catch (e) {
    console.error(e);
    status("hotelStatus", "Gagal menyimpan. Periksa Firestore Rules.");
  }
}
function exportCsv() {
  if (!isAdmin) return;
  const rows = [
    [
      "Nama",
      "Email",
      "Sekolah",
      "Jurusan",
      "Hotel",
      "Pesan",
      "Status",
      "Catatan admin",
      "Waktu",
    ],
    ...applications.map((a) => [
      a.name,
      a.email,
      a.school,
      a.major,
      a.hotelName,
      a.message,
      a.status || "Menunggu",
      a.adminNote || "",
      a.createdAt?.toDate ? a.createdAt.toDate().toISOString() : "",
    ]),
  ];
  const csv = rows
    .map((r) =>
      r.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "pendaftar-pkl.csv";
  a.click();
  URL.revokeObjectURL(url);
}
function authChanged(user) {
  currentUser = user;
  isAdmin =
    !!user &&
    !!user.email &&
    user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  $("loginBtn").classList.toggle("hidden", !!user)
