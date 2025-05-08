document.addEventListener('click', function () {
  const video = document.getElementById('bgVideo');
  const intro = document.getElementById('intro');
  const main = document.getElementById('main');

  intro.style.display = 'none';
  main.style.display = 'flex';

  video.muted = false;
  video.volume = 0.3; // volumen al 30%
  video.play();
});

// Control con teclado
document.addEventListener('keydown', function (e) {
  const video = document.getElementById('bgVideo');

  if (!video) return;

  switch (e.key.toLowerCase()) {
      case 'm': // Mute / unmute
          video.muted = !video.muted;
          break;
      case 'arrowup': // Subir volumen
          video.volume = Math.min(1, video.volume + 0.1);
          break;
      case 'arrowdown': // Bajar volumen
          video.volume = Math.max(0, video.volume - 0.1);
          break;
  }
});

// Estado de Discord con Lanyard
const userId = "664747091637305364"; // Tu ID de usuario de Discord

let songStart = 0;
let songEnd = 0;
let isPlaying = false;

async function fetchDiscordStatus() {
  const container = document.getElementById("discord-status");
  container.innerHTML = "Cargando estado de Discord...";

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = "No se pudo obtener el estado.";
      return;
    }

    const user = data.data;
    const status = user.discord_status;
    const activities = user.activities;
    const isListening = user.listening_to_spotify;

    let statusColor;
    switch (status) {
      case "online":
        statusColor = "#43b581"; // verde
        break;
      case "dnd":
        statusColor = "#f04747"; // rojo (Do Not Disturb)
        break;
      case "idle":
        statusColor = "#faa61a"; // amarillo (Ausente)
        break;
      case "offline":
      default:
        statusColor = "#808080"; // gris (desconectado/invisible)
        break;
    }

    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.discord_user.id}/${user.discord_user.avatar}.png`;
    const username = user.discord_user.username;

    let activityContent = `<p style="margin:0;">𝓗𝓸𝓵𝓪 𝓼𝓸𝔂 𝓜𝓸𝓻𝓸</p>`;
    let largeImage = "";

    if (isListening) {
      const { song, artist, album_art_url, timestamps } = user.spotify;
      largeImage = album_art_url;

      songStart = timestamps.start;
      songEnd = timestamps.end;
      isPlaying = true;

      const now = Date.now();
      const progressPercent = ((now - songStart) / (songEnd - songStart)) * 100;

      activityContent = `
        <div>
          <span style="font-weight: bold;">🎧 Escuchando:</span> ${song}<br>
          <span style="color: #aaa; font-size: 0.9em;">de ${artist}</span>
          <div id="spotify-progress-container">
            <div id="spotify-progress" style="width: ${progressPercent.toFixed(2)}%;"></div>
          </div>
        </div>
      `;
    } else {
      isPlaying = false;
      const activeApp = activities.find(a => a.type === 0);
      if (activeApp) {
        const { name, state, assets } = activeApp;
        if (assets?.large_image) {
          if (assets.large_image.startsWith("mp:external")) {
            largeImage = assets.large_image.replace("mp:external", "https://media.discordapp.net/external");
          } else {
            largeImage = `https://cdn.discordapp.com/app-assets/${activeApp.application_id}/${assets.large_image}.png`;
          }
        }

        activityContent = `
          <div>
            <span style="font-weight: bold;">🎮 Jugando:</span> ${name}<br>
            ${state ? `<span style="color: #888; font-size: 0.85em;">${state}</span>` : ""}
          </div>
        `;
      }
    }

    container.innerHTML = `
      <div style="display: flex; align-items: center; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 15px; max-width: 500px;">
        <img src="${avatarUrl}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid ${statusColor};">
        <div style="margin-left: 20px; color: white;">
          <strong style="font-size: 1.05em;">${username}</strong>
          <div style="margin-top: 6px;">
            ${activityContent}
          </div>
        </div>
        ${largeImage ? `<img src="${largeImage}" style="width: 60px; height: 60px; border-radius: 10px; margin-left: auto;">` : ""}
      </div>
    `;
  } catch (err) {
    console.error("Error al obtener estado de Discord:", err);
    container.innerHTML = "Error cargando estado.";
  }
}

function updateSpotifyProgressBar() {
  if (!isPlaying) return;
  const now = Date.now();
  const progress = ((now - songStart) / (songEnd - songStart)) * 100;
  const progressBar = document.getElementById("spotify-progress");
  if (progressBar) {
    progressBar.style.width = Math.min(progress, 100).toFixed(2) + "%";
  }
}

fetchDiscordStatus();
setInterval(fetchDiscordStatus, 15000); // Actualiza cada 15s
setInterval(updateSpotifyProgressBar, 1000); // Actualiza barra cada 1s
