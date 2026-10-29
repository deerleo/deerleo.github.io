/* 播客播放器交互（文章页；每页至多一个 .podcast-player） */
(function () {
  var player = document.querySelector(".podcast-player");
  if (!player) return;

  var audio = player.querySelector("audio");
  var btn = player.querySelector(".pc-play");
  var icPlay = player.querySelector(".ic-play");
  var icPause = player.querySelector(".ic-pause");
  var bar = player.querySelector(".pc-bar");
  var fill = player.querySelector(".pc-bar-fill");
  var durEl = player.querySelector(".pc-dur");

  function fmt(s) {
    if (!isFinite(s)) return "--:--";
    s = Math.round(s);
    var m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  audio.addEventListener("loadedmetadata", function () {
    durEl.textContent = fmt(audio.duration);
  });

  function toggle() {
    if (audio.paused) audio.play();
    else audio.pause();
  }

  btn.addEventListener("click", toggle);
  audio.addEventListener("play", function () {
    icPlay.style.display = "none";
    icPause.style.display = "block";
  });
  audio.addEventListener("pause", function () {
    icPlay.style.display = "block";
    icPause.style.display = "none";
  });

  audio.addEventListener("timeupdate", function () {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    fill.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", Math.round(pct));
    durEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
  });

  audio.addEventListener("ended", function () {
    fill.style.width = "0%";
    audio.currentTime = 0;
  });

  function seek(e) {
    var rect = bar.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var ratio = Math.min(1, Math.max(0, x / rect.width));
    if (audio.duration) audio.currentTime = ratio * audio.duration;
  }
  bar.addEventListener("click", seek);
  bar.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") audio.currentTime += 10;
    if (e.key === "ArrowLeft") audio.currentTime -= 10;
  });
})();
