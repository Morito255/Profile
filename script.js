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

// Estado discord con Id 

const users = [
  {
    id: "664747091637305364", // ID usuario 1
    containerId: "discord-status-user1",
    customMessage: "𝓗𝓸𝓵𝓪 𝓼𝓸𝔂 𝓜𝓸𝓻𝓸"
  },
  {
    id: "664747091637305364", // ID usuario 2
    containerId: "discord-status-user2",
    customMessage: ""
  }
];

let songData = {}; // Almacena tiempos por usuario

async function fetchDiscordStatus(user) {
  const container = document.getElementById(user.containerId);
  container.innerHTML = "Cargando estado de Discord...";

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${user.id}`);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = "No se pudo obtener el estado.";
      return;
    }

    const userData = data.data;
    const status = userData.discord_status;
    const activities = userData.activities;
    const isListening = userData.listening_to_spotify;

    let statusColor;
    switch (status) {
      case "online": statusColor = "#43b581"; break;
      case "dnd": statusColor = "#f04747"; break;
      case "idle": statusColor = "#faa61a"; break;
      default: statusColor = "#808080"; break;
    }

    const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.discord_user.id}/${userData.discord_user.avatar}.png`;
    const username = userData.discord_user.username;

    let activityContent = `<p style="margin:0;">${user.customMessage}</p>`;
    let largeImage = "";

    if (isListening) {
      const { song, artist, album_art_url, timestamps } = userData.spotify;
      largeImage = album_art_url;

      songData[user.id] = {
        start: timestamps.start,
        end: timestamps.end,
        isPlaying: true
      };

      const now = Date.now();
      const progressPercent = ((now - timestamps.start) / (timestamps.end - timestamps.start)) * 100;

      activityContent = `
        <div>
          <span style="font-weight: bold;">🎧 Escuchando:</span> ${song}<br>
          <span style="color: #aaa; font-size: 0.9em;">de ${artist}</span>
          <div id="spotify-progress-${user.id}" style="height: 5px; background: #444; margin-top: 4px; border-radius: 3px;">
            <div style="height: 100%; background: #1DB954; width: ${progressPercent.toFixed(2)}%; border-radius: 3px;"></div>
          </div>
        </div>
      `;
    } else {
      songData[user.id] = { isPlaying: false };
      const activeApp = activities.find(a => a.type === 0);
      if (activeApp) {
        const { name, state, assets } = activeApp;
        if (assets?.large_image) {
          largeImage = assets.large_image.startsWith("mp:external")
            ? assets.large_image.replace("mp:external", "https://media.discordapp.net/external")
            : `https://cdn.discordapp.com/app-assets/${activeApp.application_id}/${assets.large_image}.png`;
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
      <div style="display: flex; align-items: center; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 15px; max-width: 500px; margin-bottom: 20px;">
        <img src="${avatarUrl}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid ${statusColor};">
        <div style="margin-left: 20px; color: white;">
          <strong style="font-size: 1.05em;">${username}</strong>
          <div style="margin-top: 6px;">${activityContent}</div>
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
  users.forEach(user => {
    const data = songData[user.id];
    if (!data?.isPlaying) return;

    const now = Date.now();
    const progress = ((now - data.start) / (data.end - data.start)) * 100;
    const progressBar = document.querySelector(`#spotify-progress-${user.id} > div`);
    if (progressBar) {
      progressBar.style.width = Math.min(progress, 100).toFixed(2) + "%";
    }
  });
}

// Iniciar
users.forEach(user => fetchDiscordStatus(user));
setInterval(() => users.forEach(user => fetchDiscordStatus(user)), 15000);
setInterval(updateSpotifyProgressBar, 1000);
