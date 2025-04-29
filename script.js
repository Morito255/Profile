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
  
      let statusColor = "#808080"; // gris por defecto (offline)
      if (status === "online") statusColor = "#43b581";
  
      const avatarUrl = `https://cdn.discordapp.com/avatars/${user.discord_user.id}/${user.discord_user.avatar}.png`;
      const username = user.discord_user.username;
  
      let activityContent = `<p style="margin:0;">𝓗𝓸𝓵𝓪 𝓼𝓸𝔂 𝓜𝓸𝓻𝓸</p>`;
      let largeImage = "";
  
      if (isListening) {
        const { song, artist, album_art_url } = user.spotify;
        largeImage = album_art_url;
        activityContent = `
          <div>
            <span style="font-weight: bold;">🎧 Escuchando:</span> ${song}<br>
            <span style="color: #aaa; font-size: 0.9em;">de ${artist}</span>
          </div>
        `;
      } else {
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
  
  fetchDiscordStatus();
  setInterval(fetchDiscordStatus, 15000); // Actualiza cada 15s
  