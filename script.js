const video = document.getElementById('bgVideo');
const intro = document.getElementById('intro');
const main = document.getElementById('main');
const enterButton = document.getElementById('enterButton');
const soundButton = document.getElementById('soundButton');
const statusContainer = document.getElementById('discord-status-user1');
const discordUserId = '664747091637305364';
const profileCard = document.querySelector('.profile-card');
const viewCount = document.getElementById('viewCount');
const supabaseUrl = 'https://dkneolnxjyndwiszdjht.supabase.co';
const supabasePublishableKey = 'sb_publishable_PHQh2PdwIyBjTJV3CccO8w_ytDhQIYe';

let entered = false;
let spotify = null;

function enterProfile() {
  if (entered) return;
  entered = true;
  document.body.classList.add('is-entering');

  // Fuerza el contenido a ocupar la ventana, incluso en navegadores que
  // mantienen estilos del atributo hidden durante la transición.
  main.hidden = false;
  main.style.display = 'grid';
  main.style.opacity = '1';
  main.style.visibility = 'visible';

  // El clic del usuario permite reproducir el vídeo con audio desde el inicio.
  video.muted = false;
  video.volume = 0.3;
  video.play().catch(() => {});
  window.setTimeout(() => {
    intro.hidden = true;
    intro.style.display = 'none';
  }, 560);
}

function setSound(enabled) {
  video.muted = !enabled;
  soundButton.setAttribute('aria-pressed', String(enabled));
  soundButton.setAttribute('aria-label', enabled ? 'Silenciar sonido' : 'Activar sonido');
  soundButton.querySelector('.sound-label').textContent = enabled ? 'Silenciar' : 'Sonido';
}

enterButton.addEventListener('click', enterProfile);
soundButton.addEventListener('click', () => setSound(video.muted));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !entered) enterProfile();
  if (event.key.toLowerCase() === 'm') setSound(video.muted);
  if (event.key === 'ArrowUp') video.volume = Math.min(1, video.volume + 0.1);
  if (event.key === 'ArrowDown') video.volume = Math.max(0, video.volume - 0.1);
});

if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  profileCard.addEventListener('pointermove', (event) => {
    const rect = profileCard.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    profileCard.style.transform = `perspective(900px) rotateX(${y * -2}deg) rotateY(${x * 2}deg) translateY(-2px)`;
  });
  profileCard.addEventListener('pointerleave', () => { profileCard.style.transform = ''; });
}

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const statusColors = { online: '#5df2a0', idle: '#ffca6a', dnd: '#ff6382', offline: '#777486' };
// Algunos juegos (como Roblox) no entregan "assets" a Discord pese a estar detectados.
// Esta tabla usa el icono público de la aplicación en esos casos.
const applicationIcons = {
  '363445589247131668': 'https://cdn.discordapp.com/app-icons/363445589247131668/f2b60e350a2097289b3b0b877495e55f.png?size=128'
};

function paintStatus(status) {
  const color = statusColors[status] || statusColors.offline;
  document.querySelectorAll('.status-dot, .live-dot').forEach((dot) => {
    dot.style.backgroundColor = color;
    dot.style.boxShadow = `0 0 12px ${color}`;
  });
}

function updateProgress() {
  const bar = document.getElementById('spotify-progress');
  if (!bar || !spotify) return;
  const percent = Math.max(0, Math.min(100, ((Date.now() - spotify.start) / (spotify.end - spotify.start)) * 100));
  bar.style.width = `${percent}%`;
}

async function syncViewCount() {
  const storageKey = 'moro-profile-viewed-at';
  const lastSeen = Number(localStorage.getItem(storageKey) || 0);
  const shouldIncrement = Date.now() - lastSeen > 24 * 60 * 60 * 1000;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/record_profile_view`, {
      method: 'POST',
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ should_increment: shouldIncrement })
    });
    if (!response.ok) throw new Error('No se pudo obtener el contador');
    const total = await response.json();
    viewCount.textContent = Number(total).toLocaleString('es-ES');
    if (shouldIncrement) localStorage.setItem(storageKey, String(Date.now()));
  } catch {
    viewCount.textContent = '—';
  }
}

function getActivityImage(activity) {
  const image = activity.assets?.large_image;
  if (!image) return applicationIcons[activity.application_id] || '';
  if (image.startsWith('mp:external/')) {
    return image.replace('mp:external/', 'https://media.discordapp.net/external/');
  }
  if (image.startsWith('http')) return image;
  return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png`;
}

function renderPresence(data) {
  const user = data.discord_user;
  const status = data.discord_status || 'offline';
  const activity = data.activities?.find((item) => item.type === 0);
  const customStatus = data.activities?.find((item) => item.type === 4);
  const isSpotify = data.listening_to_spotify && data.spotify;
  const avatar = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : 'avatar.png';
  let title = 'Sin actividad pública';
  let subtitle = 'Disponible en Discord';
  let art = '';

  paintStatus(status);

  if (isSpotify) {
    title = `Escuchando ${data.spotify.song}`;
    subtitle = data.spotify.artist;
    art = data.spotify.album_art_url;
    spotify = data.spotify.timestamps;
  } else if (activity) {
    title = `Jugando a ${activity.name}`;
    subtitle = activity.state || activity.details || 'En actividad';
    art = getActivityImage(activity);
    spotify = null;
  } else if (customStatus?.state) {
    title = customStatus.state;
    subtitle = 'Estado personalizado';
    spotify = null;
  } else {
    spotify = null;
  }

  statusContainer.innerHTML = `<div class="discord-presence" style="--status-color:${statusColors[status] || statusColors.offline}">
    <img class="discord-avatar" src="${avatar}" alt="Avatar de ${escapeHtml(user.username)}">
    <div class="presence-copy"><strong>${escapeHtml(user.global_name || user.username)}</strong><span>${escapeHtml(title)}</span><span>${escapeHtml(subtitle)}</span>${isSpotify ? '<div class="spotify-progress"><i id="spotify-progress"></i></div>' : ''}</div>
    ${art ? `<img class="activity-art" src="${art}" alt="Icono de ${escapeHtml(activity?.name || 'la actividad')}">` : activity ? '<span class="activity-fallback" aria-label="Juego activo">🎮</span>' : ''}
  </div>`;
  updateProgress();
}

async function fetchPresence() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${discordUserId}`);
    const payload = await response.json();
    if (!payload.success) throw new Error('Respuesta no válida');
    renderPresence(payload.data);
  } catch {
    statusContainer.innerHTML = '<span>El estado de Discord no está disponible ahora mismo.</span>';
  }
}

fetchPresence();
syncViewCount();
// Mantiene el perfil sincronizado sin recargar la página.
window.setInterval(fetchPresence, 15000);
window.setInterval(updateProgress, 1000);
