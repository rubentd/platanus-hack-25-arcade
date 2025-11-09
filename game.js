// Race to AGI - Two-Player Resource Collection Game
// Collect Data, Compute, and Funding to train your AGI before your opponent!

const ARCADE_CONTROLS = {
  // Player 1 - WASD
  'P1U': ['w'], 'P1D': ['s'], 'P1L': ['a'], 'P1R': ['d'],
  'P1A': ['u'], 'P1B': ['i'], 'P1C': ['o'],
  'P1X': ['j'], 'P1Y': ['k'], 'P1Z': ['l'],
  'START1': ['1', 'Enter'],
  
  // Player 2 - Arrow keys
  'P2U': ['ArrowUp'], 'P2D': ['ArrowDown'], 
  'P2L': ['ArrowLeft'], 'P2R': ['ArrowRight'],
  'P2A': ['r'], 'P2B': ['t'], 'P2C': ['y'],
  'P2X': ['f'], 'P2Y': ['g'], 'P2Z': ['h'],
  'START2': ['2']
};

const KEYBOARD_TO_ARCADE = {};
for (const [code, keys] of Object.entries(ARCADE_CONTROLS)) {
  if (keys) {
    (Array.isArray(keys) ? keys : [keys]).forEach(k => {
      KEYBOARD_TO_ARCADE[k] = code;
    });
  }
}

function setPlayersVisible(visible) {
  if (p1 && p1.sprite) p1.sprite.setVisible(visible);
  if (p2 && p2.sprite) p2.sprite.setVisible(visible);
}

function addText(scene, x, y, text, style = {}) {
  const merged = { ...style, fontFamily: FONT_FAMILY };
  const obj = scene.add.text(x, y, text, merged);
  if (obj.setResolution) obj.setResolution(1);
  return obj;
}

function currentSceneTime(scene) {
  if (scene?.time && typeof scene.time.now === 'number') return scene.time.now;
  return lastUpdateTime;
}

function isPlayerInvulnerable(playerNum, time) {
  const now = typeof time === 'number' ? time : lastUpdateTime;
  const until = playerNum === 1 ? p1InvulnUntil : p2InvulnUntil;
  return until > 0 && now <= until;
}

function stopPlayerBlink(playerNum) {
  const player = playerNum === 1 ? p1 : p2;
  const tween = playerNum === 1 ? p1BlinkTween : p2BlinkTween;
  if (tween) tween.stop();
  if (player?.sprite) player.sprite.setAlpha(1);
  if (playerNum === 1) {
    p1BlinkTween = null;
  } else {
    p2BlinkTween = null;
  }
}

function clearPlayerInvulnerability(playerNum) {
  if (playerNum === 1) {
    if (p1InvulnTimer) p1InvulnTimer.remove(false);
    p1InvulnTimer = null;
    p1InvulnUntil = 0;
  } else {
    if (p2InvulnTimer) p2InvulnTimer.remove(false);
    p2InvulnTimer = null;
    p2InvulnUntil = 0;
  }
  stopPlayerBlink(playerNum);
}

function setPlayerInvulnerable(scene, playerNum, startTime = currentSceneTime(scene)) {
  const player = playerNum === 1 ? p1 : p2;
  if (!scene || !player || !player.sprite || !scene.time) return;
  const until = startTime + INVULNERABILITY_DURATION;
  if (playerNum === 1) {
    if (p1InvulnTimer) p1InvulnTimer.remove(false);
    p1InvulnTimer = null;
    p1InvulnUntil = until;
  } else {
    if (p2InvulnTimer) p2InvulnTimer.remove(false);
    p2InvulnTimer = null;
    p2InvulnUntil = until;
  }
  stopPlayerBlink(playerNum);
  const sprite = player.sprite;
  sprite.setAlpha(1);
  const tween = scene.tweens.add({
    targets: sprite,
    alpha: { from: 1, to: 0.25 },
    duration: BLINK_TWEEN_DURATION,
    yoyo: true,
    repeat: -1
  });
  const timer = scene.time.delayedCall(INVULNERABILITY_DURATION, () => {
    if (tween) tween.stop();
    if (sprite) sprite.setAlpha(1);
    if (playerNum === 1) {
      p1InvulnUntil = 0;
      p1BlinkTween = null;
      p1InvulnTimer = null;
    } else {
      p2InvulnUntil = 0;
      p2BlinkTween = null;
      p2InvulnTimer = null;
    }
  });
  if (playerNum === 1) {
    p1BlinkTween = tween;
    p1InvulnTimer = timer;
  } else {
    p2BlinkTween = tween;
    p2InvulnTimer = timer;
  }
}

const DATA_TEXTURE_KEY = 'data_cylinder';
const SCANDAL_TEXTURE_KEY = 'scandal_square';
const LEAK_TEXTURE_KEY = 'leak_drop';

function ensureDataTexture(scene) {
  if (!scene) return DATA_TEXTURE_KEY;
  if (scene.textures.exists(DATA_TEXTURE_KEY)) return DATA_TEXTURE_KEY;
  const gfx = scene.make.graphics({ add: false });
  gfx.fillStyle(0x00bfff, 1);
  gfx.fillEllipse(32, 14, 48, 18);
  gfx.fillRect(8, 14, 48, 34);
  gfx.fillStyle(0x0085ff, 1);
  gfx.fillEllipse(32, 48, 48, 18);
  gfx.fillStyle(0x4de7ff, 0.8);
  gfx.fillEllipse(32, 12, 30, 10);
  gfx.lineStyle(2, 0xffffff, 0.35);
  gfx.strokeEllipse(32, 14, 48, 18);
  gfx.strokeEllipse(32, 30, 48, 18);
  gfx.strokeEllipse(32, 48, 48, 18);
  gfx.lineStyle(1, 0x002b5b, 0.6);
  gfx.strokeRect(8, 14, 48, 34);
  gfx.generateTexture(DATA_TEXTURE_KEY, 64, 64);
  gfx.destroy();
  return DATA_TEXTURE_KEY;
}

function ensureScandalTexture(scene) {
  if (!scene) return SCANDAL_TEXTURE_KEY;
  if (scene.textures.exists(SCANDAL_TEXTURE_KEY)) return SCANDAL_TEXTURE_KEY;
  const baseKey = '__tmp_scandal_base';
  const gfx = scene.make.graphics({ add: false });
  gfx.fillStyle(0xffffff, 1);
  gfx.fillRect(12, 12, 40, 40);
  gfx.lineStyle(2, 0xcc0000, 0.8);
  gfx.strokeRect(12, 12, 40, 40);
  gfx.generateTexture(baseKey, 64, 64);
  gfx.destroy();

  const rt = scene.make.renderTexture({ add: false, width: 64, height: 64 });
  rt.draw(baseKey, 0, 0);

  const textObj = scene.make.text({
    add: false,
    text: '!',
    style: {
      fontFamily: FONT_FAMILY,
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ff2222',
      align: 'center'
    }
  });
  textObj.setOrigin(0.5, 0.6);
  textObj.setPosition(32, 36);
  rt.draw(textObj);
  rt.saveTexture(SCANDAL_TEXTURE_KEY);

  rt.destroy();
  textObj.destroy();
  scene.textures.remove(baseKey);

  return SCANDAL_TEXTURE_KEY;
}

function ensureLeakTexture(scene) {
  if (!scene) return LEAK_TEXTURE_KEY;
  if (scene.textures.exists(LEAK_TEXTURE_KEY)) return LEAK_TEXTURE_KEY;
  const gfx = scene.make.graphics({ add: false });
  const dropTriangle = new Phaser.Geom.Triangle(32, 6, 16, 34, 48, 34);
  gfx.fillStyle(0x7fd8ff, 1);
  gfx.fillTriangleShape(dropTriangle);
  gfx.fillCircle(32, 38, 16);
  gfx.lineStyle(2, 0xffffff, 0.7);
  gfx.strokeTriangleShape(dropTriangle);
  gfx.strokeCircle(32, 38, 16);
  gfx.lineStyle(1, 0x2a8adb, 0.6);
  gfx.strokeTriangleShape(new Phaser.Geom.Triangle(32, 8, 20, 34, 44, 34));
  gfx.strokeCircle(32, 38, 12);
  gfx.generateTexture(LEAK_TEXTURE_KEY, 64, 64);
  gfx.destroy();
  return LEAK_TEXTURE_KEY;
}

const gp = `data:image/png;base64,`
const toData = (payload) => gp + payload.replace(/_/g, '/');

const a = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAIGNIUk0AAHomAACAhAAA'
const b = '+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAB'

const CHARACTER_SPRITE = {
  north: toData(`${a}${b}OUExURQAAACgHDj0VGVIxLe22mGM4M_rJqffQuvvfzNt5Rt5nIpR1ebtxVNBlMHJKTOmUZ_mtdLidpbCPkvv4+KSDhsSxuOrf4ZVkX9eVgAAAABCvZ60AAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNU7CsHoAAADzSURBVFjD7ZVJDoMwDEWxnRZKOhEH2vuftJko7BCfRVUpb5GdnwfZ0DSVSmUTKqDxLCIk8QHzx9AAbJAFqIuQ2ZxSuMFKSN2bkxF0CiTrHn4tQIZ4bmktOO8WtB0xl3imttstuFzCDnHJT73d38M1bWG5hhswxOWW8Gsq4Xc+KIALaMQ8Ak9B43lwGvAWNLAOmhkggw_pfUJHC6xBQ6ouF+BVoWPSmQkWcBaQBwWOXGQgo8gqkY5Z4GiEKuhf9G3B9ohgstnAdJ8Qwc0s16joOR_4rSTB_Gs7IpjffxVwHN+BTxK9TBRc33gFTPNbqVQqm3wAo_8LHdFOgzAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjUtMTEtMDlUMDM6NTA6NTMrMDA6MDCdfvCHAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI1LTExLTA5VDAzOjUwOjUzKzAwOjAw7CNIOwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNS0xMS0wOVQwMzo1MDo1MyswMDowMLs2aeQAAAAASUVORK5CYII=`),
  east: toData(`${a}${b}aUExURQAAACgHDj0VGVIxLWM4M_rJqe22mOrf4fvfzPfQuioTObdKFPKPRfv4+BkasNt5RrtxVNBlMLCPkteVgOmUZ6SDhpVkX5R1eXJKTLidpd5nIvmtdIwmEQAAAL4lbbYAAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNU7CsHoAAAEBSURBVFjD7dbNVoQwDAXgJv1hOhplkEJHff_nNC2cce2NG4+9+3ykoaU4NzLyD0LMTASXs9eE4D2DjydPLapgTfRSLdYuIOEo1yWEyFAPHUjeR50BAcC5gB59E0ZggoBvgS82gDn_fISOHsL16TmCQEc4XwUBunDJRElecECEQ0QBFTi9xpaUIKAJBzBj9U249aD1bnlb1xv+PXFcRKYZB2hbSpG94ICWSxVvAERzn+A1nIDgQF1EdsEBR2bg_jsAeK08gM3Qwfu2FzZsZaKcY8XrHc16lPEJtA7Wj08bQIyfhAOo1TDDdr0afk9OwO+mJQQfsmkf6BQtG2lkZORP5Qv6OglePyUq0wAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNS0xMS0wOVQwMzo1MDo1MyswMDowMJ1+8IcAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjUtMTEtMDlUMDM6NTA6NTMrMDA6MDDsI0g7AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI1LTExLTA5VDAzOjUwOjUzKzAwOjAwuzZp5AAAAABJRU5ErkJggg==`),
  south: toData(`${a}${b}dUExURQD_ACgHDj0VGVIxLWM4M+22mHJKTPfQuvrJqbtxVKRHQOmUZ_vfzJR1eerf4SoTOdt5RvmtdNBlMAAAAPv4+BkasBsRibidpaSDht5nIvKPRZVkX7CPksSxuAD_ALE1QZAAAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNtfL4cAAAAFBSURBVFjD7ZXdcoQgDIVNABO6wlabrbja93_N8qMPYJzedDzjwNX5PAEm6bpbt_6_YJfWj8YYgLyg8v_GWqwAo8oAaFxvqqzVEMC6HnMJvTNOEwHQuhLethDnCdB8gJcAgI5QC6gER8TtNjUA9JT9XI_i_FNgBPxgZqJHjoB0GjAQhPj0zJ9ICONwGhCmLycvYZZvmcGn04DOL295xQp4L+t5f84wipQEMY5B4++6xLsU+Zts8xutH1Pqp2nySdlRYN1kXRYvYdV1lCAoGw1JQHSHOGdn3FLMm+oUMeYEIpsUjqojSQVI3TQAvAqAn3QAkuoil7jlKiTOM4ZhUQByN2kJVmCaFIDAtE8VYFY9hPUBe0d+e42_Nub6oXa6FjeUMq4AjlUHwDIO8nC6mAD1CaiMdehZXwLCsd66devW3+sX_0EO8BAyGdMAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjUtMTEtMDlUMDM6NTA6NTMrMDA6MDCdfvCHAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI1LTExLTA5VDAzOjUwOjUzKzAwOjAw7CNIOwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNS0xMS0wOVQwMzo1MDo1NCswMDowMH6RV2oAAAAASUVORK5CYII=`),
  west: toData(`${a}${b}XUExURQAAACgHDj0VGWM4M1IxLe22mHJKTJVkX+rf4bCPkridpcSxuLtxVPvfzPfQuumUZ_v4+CoTOdeVgPrJqYwmEfmtdKuTxtt5RtBlMN5nIpR1eaSDhgAAAEgX11gAAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNtfL4cAAAAEBSURBVFjD7dbRbsMgDAVQ7ACBtDRuWRdW_v8_Zyp10159pb2U++4jHMUY52Zm3iCkAcp58Ro7QT7EcQQrQf55gGcsAo3C9QUYBPZKBB+WYBRG878xAYkwIG8nQgDnAp3pp94ElMtOECDXcqNXDECVqwRK6QMDRO7WkarlU0I4ym4eyV1KrfUCzPRd64+G3Alr+2rtvLIZcHSIyPaIZoCT1ku0A1lSz72be2CtF8ndfi2OehE7wFqsQASA00NbsAMkWYHN_h_oKMFAFGFgvTHHviGAozFPwCw4VmCHNnQLFVrx4zNAAC3IC2EAZNzufwQEiBEDKCxYC8TgQ21mZubf8g0eiArBSRiIZgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNS0xMS0wOVQwMzo1MDo1NCswMDowMFjZzgkAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjUtMTEtMDlUMDM6NTA6NTQrMDA6MDAphHa1AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI1LTExLTA5VDAzOjUwOjU0KzAwOjAwfpFXagAAAABJRU5ErkJggg==`),
}

const c = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAA'

const HQ_ICON = toData(`${c}J4klEQVR4AeybeWxUVRTGz2CMwtipAkUQWhSoFCgKomKKlbqU2lYC7rjVCK5RURLjUk2MooJ_oXWNiApKNC4JDVJwjYqMCyIJiKgFcYmKIKIVJK51fhfP487rmzczfa8wCsbvnXPPve+++5173zn3vimdZDf_b48DdvMFIHtWQC6ugDXLv2+dVHdt684YW86sAEgrlPjOcMIud4BNunHhPOXuSJwAHEPIyi5xgJJGwgfiE6+aJI0L5lP0REc5Yac5ALIKGMY_eAch6YgveS9u2nHBCQA9LHS4AyC9_M3PnYDGbDP4R5941JBHB38MHCYA3Q2cANQephNCdwCEbdgz7TXb67v0dojXVo1Tjo78KVoiAIPbCWE4IjQHKGkGyiz_0rJVkMz0NfWTMRu4Z3lg6WCBODANXJejRo8wFi8nUBHUCYEcoKSRDAbCRiaCGaTtoAbx_KMrpXt+AU0MsPXqXSilfbfDGD0u1ceVGytO6NG9h9FZDYBCECcEcgAPBxBnec+cPYuiAwgClvk5p50rI48pM3AaZKHEunUW4L6lee0atymrcmAHQFxnWmeHEUB86OAjBFRUVUlR965mpqlLhVg0mqqqjZ3VgHHDDxsQ7UZgB+iTIQy0zFKvObZMgNqQsWgyyRmX10hl6f4Gf6xYTJMk9Ni0Tjr9uCrJRoHXAifYTseeDu76UBwAcYIYcD_Ar_xqwy0Sf32lVFedYaAryb5H3_OxJX1ss9G9XglTkcUlFAeUxPr6Lu9Us_xww2yZevdtZrg4EZiC64ITln74nng5wdU062IoDvB66jNTLzPLmuX9wtOLzAwz0_Ysq052YPUAd18sc8C7vuDl+VLcf4C7SaByhznAJs1egFFC1J5ldGyTzj475QpiH8BSxwn0wWpAvrNwplx2_BGogRDYAQtfel7uv+MCWft6o2x+e5EzGJs0abDk1IkCUdKh0yihsA9ICN__Rw050qRAnGAHPdJu0BUR2AE60yxn3lNlwuxCuvLESqlIpEHNBi1bt2qTrCUrQW_CGei6ItDbg8AO0JmGMMtZB6FpkPyvtlSSOAFqe3ZL1aSNPefSIEubnV6bkfoYSINkCF1FbJ_dzZub5nruA2hnrwjK7UHgFcBDSYN+M339iaOcjFDU8g23GChxVhErCJgK14VlPiz6+383DXIkrv53swNZ5ac6xEmBQOtU8q6DFatXyf8iDdpxAuIA4pwIlbQtNQ3+XTTcmFkNKKTBMDZGgV8BOw2+3LB9V8cAdXYhTBocM_lWkwbJCtQrOCylIq9tSIPorAQ7DYaxIgI7QN9j0iCDVDCzpEECY0UiDSpJvzQYiyYflLQvlXbQwxnYdUWgtweBHcBMQ1ahg9A0qMTVHoumJunnHL1fJWmQ18JeEVqXjQzsAB4G2Rsuvcp82qKcKTQNsgcAdobQPjgOd_1rvRZDl6E4IN2oyPUQBPaZX1+fao8MoX2yxHnXe_76TbvSoPaTSnaYAzI5DfL6MDB9fZCUbfCug5w9DZIFlGzntR86Y7dnV4mSEYA2gjBldpGAdKh1Kv3SYKevlgc+HgdeAfHEFx0la2cCSEMQbMnPE9IgKRAoOSSnQXaRgLIXNA3aQY9VQVteEWR7EdgBfNGBLCQhqwNhZsnxzOyRJ5xpzvt+JPW+TCVZACfkRBaAOCTdS5gjcJik3c6x9wXuukzLgVcAD2KmIYueLewMYccQ7Yc0uHZpoxZDl6E4IN2obJI1vXec+Z+8+uq0X4X1hw_2_SDds7Kt7zAHaGYg92uQJN_zQ4oOEp0YQpmYAdBtfLatq4Clia_C7Af0E5jXbwX2fZnqgR1AGmSGW1a+K_YShqyCIMmBiFgBdHDo2CHOmQFonUpNg7TDplEfmRNp0CZpp0EGy2EIQLTu4ouFjOAOlBWJgxIfS91nBu5X5HQaZJAQhCigDJjVosJC89MYZwUIkhFi0dSHIe7LFDmVBvkkRhaAsE0A0nY5bD1n0uDefXZEdi+S3Vu7eJnFfRr0+ipMGgwr4HkNIuMgePcrA1sVXh3ZNgKjnQX44YRsULpPRCZV9DNNaWNnh+rEidDrqzDBDhDwynt1Trv31zEizYPSXDJygN3ZxlV9pezMEc4fPT12_yzhqy9ZYMKhReZx_OgJITdIe9hohCQ7oBNDFJRtsN0F2HAEQOebIE7RtIiNcTUvLkQ1uO6eMc44jcHj0snDlmSCPJ0CKuJLNiEcJ0AKQAZJpWYDJYXkMKSgDcBO4NTs4M4QtKkt7SqkQg5COEL3_uhAHQJ52n+8ejNCGG_BkC+F8RtDiktaB3BfcfnXQseNj+xHsQ2UCGT446ieBQXmL78gBDnNAgTFWHRHFsBO4CQ7UNem438NGkPsoEcWoFodgq5gnIxXy37S1wHqVTr060TPApDJi0Xl8aceMgFuSu1Q887b8YAY0Ks4X4gBM+omyLoFc2X+g9MN0KfNmCbgpik3CeC5BEHef2Av+UOGFfnGBB238qAvN3wdQGPtBB3MqW8SBeV772qQK44aZn750RiAPR2+a_45XRPf+q1fxGXwn1ucNoM6l4vCMSYU9_gTpqT_fR0Qf25ZJKm1R4EZP3TEQU5N_W03ykXnX5EWxAvAYcdG06JGAeVVxwhA94LzwAwUPx6+DqBv9811d9XIgOEHRgADBAP6DRKAvn7jRlkcf8MX9NvcvEq8kH9AgWQCnmE7ZtaceyKrty0WQP8K9_jVrjKtA2hIJ6DPt78JEhuoOXkcQvIOH+NA31HbRiN32W3T+lEjywRQD4j0ZACA_vPmjaa+tU+5AHUWbRkb0HGiY_dDRg7QDoYOOFhVIweXDDKyW2GB+SMICvvndzMziF5RVWXsn943wUjKLZu2SV4sn2oDbAoM9AnQAZFfD0PoxcVDMAtZgLIpBLhk5QC_55ABqD__jPOE1IRTSktKhKPyXrW3GkkbIvfo8gqaJoGzBPckGXdCIZADxlWPN0MknxvF4_LZsm9NfLCrTj_nZJn70TjZb+8WY8ZRKPRDnyeMqqSYEXB2Rg1TNArkALtPNjJeM2hnCH49vnP6FnkgfqE8MLVJDum_TFZ+vP23BM4J2h+ZRfWOlp4OmDNzXquCf+ygOGVig6iOZNfX9Nxrcvv4sdL3t1_lwQsnmvGyN0Avz9vXlNd8vtpINj8ju0yXK8tmy5xpKwz4Lsh3wnVffyWTjy8TJKi_rl4OGzRE+MsQcj4SaJDVzRFlgiZ_Ma7I63+SoJ81_iLzr8_QFWYg1sXTAXWXjI8oho_uFwkCXgE_nDJhrAC+Ddq44eYpnqmUdJcpnp33eMTd1uJuVE8HmJqQLumc98mn70fAW0tejNj4bsO6iBdCGpbTTYc7wHlSjip7HJCjE5PxsII2_AcAAP__iPVyWQAAAAZJREFUAwDsiSTMpxXa3AAAAABJRU5ErkJggg==`)
const BUG_ICON = toData(`${c}HD0lEQVR4AeyaT2jcRRTHZ5tqsomU0krRaqAtYgW12EaspF7ECFKNgiAFqQfRa0G8CepBBC_iRY+KB3sRih5qi2BLqdhgCxapijQejAQbkDYNpbqJcVnzmc1LHrPz+ze_+bULWfG7M_PemzfvfefvbrrOrPH_egSs8QVgeiugtwLWOAM3ZAs0R3e34Pmpu3baknoSxKZ54ECmbZKPIvLKCSChxl9z5vHbt7W+_vNiLSs4bLBt_HDO0DfLvqy+cgK+fHinGZ9rmVOXp2p5g8WWPnfO_ZO3S7BdpQQwg7NTl4OD29rqsysn2EGOjpUSwPh33DdM0bWolAD286tfTZgTT+ztmEkOxuv3bG8B98DjDNjWaJqJQVNo64SwXCkBBPTp39M1TQLJ2YSH7zX1kUcssIMItgz60eWtz1mArkpEJ4Ak3ICn6n1m7ORZK2Y11A5_ZoAVLH9Axgu1dubMPH2WVSuFz_eKMrASlQBm79hjD3WEIjN5dGPyRXB84ozZUlu9+qWPdoZvxtCysvWoBBzft2tlpnVgzBwzzywjbx18yQDuekDyyAXsf1+iT3_3o3mgnkyi9E8rXV1UAlzn0l5YWGhXpycNCQOSPrWwaEBbacwHjfWG_c_1J7Kqy6gE7D9zwbDMmXE3cM6Ascmr9lE0vvQwIlkX9GH_A+oarIiRqwvm58bqNtH60HpUAti3JMdhRsAExXV3cmbSJIFtw_bQgET6ig8IZVtADGOgi4XCBBBM2uAEeHi+z5pwtdVOn7V19rwPJ86fN2wHDTp8csu83Q4vDw232ELcCvhGl4Ss2Hz9ChHAAATjc6RlBNrf328Gf71oxSRuK56P_aP7OqScC1uG6uaNrTXz_Kb2ksdnh6EjIDZZNY4qsbkuUeNRMIBH7BVxZZE4EAPufiDttBIS0vSxdIUIYFD2ahbLvPTcRN02vrLQd_+D1uTgQLPjKW0V6oOYiE2JclULEcCyfvtoe08neW8892yLZN2Z1_bodTupzvkwtmePeXFkt8lDQlZsvnEKEYCDN5_cReEFM99_5Ih95HgNloWanGWRtyB5FM1ffqKwh+Kh4e3tQ8FKyn8UJoC7nquryNA6YV3HB6c_pQ+sAOSfz_9HkQq5JlONPMpCBPD1Fh+3DtTtnuRWoJ0HJA607b_zDd301iGB7whsg2ubO5_B7H0gr8c8t4UeqBAB0pFXHQcOJz2DC9Af27GDIhWSOMmlGiolthuutFe_jEdJHOBSrams81cLEwDDchhy6PB2d4cjQaDltAUkk7b0dT9d5yWo24xNDCDPQ0n3lXphAujIViAYATINEtRtEpe2qxN5SCnjUzIxIT6CCGAgBtRApiGJ6uS1vmxdj0091F8wAUkD8g1PdLLMIUMgOkptS7sKZPmMSgCHozsgibsy3S5KQld+HeY0JikOJco8SWkbXae_D2IjvwjJmD7bIrJSK4AggAz4zvhe+1qjLQFTd4GOhwuEvV5vP3KQuXbS9ukggrGB2IWUwQQwMC9CEtED8xVW2gQOvr+y3ghoo+dr7qOb28lrEtC7wN4FW4Gx+fGEWFx93nYQAQxI8u9+c8G49++hmXZSOgCuKQFySZi6wCcTna_k5J_ZOGjeu9QyH909ZF+mPrssWRAB4pSkCETaf3x72nz8zKg0vWVaomk6cXZ9dpVgeY+ILqQMIoCXoDsYRLyyOGDF7E9bWfogKY0lUer_nAtJBvjlzc9YSTZF5UEE8MsQyz9rMBLPstF69j6rSsvcuk___m_XXLPc7SACWAEE4s4E8tcmzq0MTkIrjYwKtlmz73NBDJxDPl0eWRABSY7Zk5zOWk9iuq3r3AzoAfKJpb8GUyYB3yTs6iEeuPI87SACSDTLOftVbEhQkqX8YrZmQFbC0l_7Eplb5onJ7UM7iAA6poGZcvWSLCVLFrg2aW2fzzT7vLpgAnxLkfeB7GMCzjNzaYHSH+ALO3zzhxLqGqGzj49gAuisQfL8MsMMIxeCSIB2UfDK484nefGFb65BxirqL8k+GgEyACRI_cPp32skAAlA5FkltrdtWt_xymQFZPUtqo9OgPuVmNljJgmMxCjTIDYQR980W5+uqCw6AXoFSDD8OyESok2CgLqAtgAZtr7k+bYJsImF6ATwD6J8wZEQiQkkYUrsRU6JLTIfkvz7bPPIohFA0Cz_tzYs2t8EfAcVNgIS1RA5pRs4vtj_ZX79dX1KOxoBOOQ1xhciTmtO8bQ_nJCoBv19IHmR41fqscqoBMh9zGxxXUm7TLCQhD_xQVvqMcqoBBAQq4CZArRjAF8ghi_XR3QCmHVmCSLcwcq08QnK+PD1jU6ADAIRaWeA2GWV+KgicRm3MgIYABIoyyCGj7TxKyUgbeBu0fUI6JaZuFlx9FbAzWK+W8btrYBumYnQOMr2+x8AAP__SjqybAAAAAZJREFUAwDAOpWu1IsVngAAAABJRU5ErkJggg==`)
const COFFEE_ICON = toData(`${c}DlklEQVR4AeyXz0tUURTHzwRtpEQzyxIMNSFXli0isUU_Ny2jP6B_w1WbgnZCmza5kWgRCRJBYOZCG6PIXwgaqemQOmkW_WAgCorPkxOvx+S8N855DjNX+My79865953v9577nrNLyvzPGVDmBSCuAlwFlLkD7giUeQG4h6A7Au4IlLkD7giUeQG4t0DZHYFgxcdmwJ1bt39HIZioVd_cABXtFzCcTEouss3zr1GotqkBiPAnml5NC7Q0Nomf+oN1Xph_bGF+wRsLruENFvDD1ADNE9Ggfa6ZTEYU+vD23aZo2nFhagBljpC6Q5s7TFupqKgQ0D5VAJjCWMfpTqk7cJimKWYGaOluZcL_lB1va_e+So6OCEdB1_IGC_xhYkAwYUwAKiFIU3OTKBcvXRaYmBwToEIAzcE1GSsEJgYgNltyjPvhuQDsMvHz8zMCtIMQFxwrRN_EABJDKGea9nagYqzEk5eZASy+_CEtmMDrjX42eOhpmev3iAb6luJZ38SAe_33EywOmMDrDSP8nOnoEERy_rnyxIfzF85Jc3Or9_8C8zGI6_XuG3_XpF8oTAwgOUzoXE3S9MAIP5x7P+m1FYHBp8_k+ciQNwfxjRN9YiWem5gZwOKACUA7Ci3Tj6VtYUjOnjoaZVrkWHMDNCNM8MPOKgjdO3BXFMSfbK0R0PlWV1MDBn7u3jLvyspqAYQG0YmjiSptmlxNDajaVymYAFGzRzjU1u6POvWf+FwdUwO4OSYAJiiMZwPBCsIhW1whx8wN0GQxQVEjHm58F+gaWRKEI_j9+mfhqvOsr7EZ4BeiRpw41iBKnKL9ueyIAf4EdrptakDP4FhipwXmur+pAbluHub7nr7BMGF5xxS9AX3jc6ZVVPQG5L21IScWtQHr6x9Dysg_zNyA6dk5gagpcvYfDU9GnRY53tyAl8tfE9fqqz0TchnBjo_PpgTxDZlfYn3+ccvcAG4CmACYoCBWQTQ7frPziMDVdtufweQEsRjALz5uBpigXKnZI4BghZg4icWA3qlUJE2vZzbkwdhcpDn5BsdiwJO1T4n+xW8CWyXa92JFYOnLD+l+s2j6_tc8YjGAm2ECYILSO5WS3qmUJxrhxHW9mkkA7XyIOic2AzQxTAiCYEXj4rrGbkBcwsLexxkQ1qlSjXMVUKo7G1aXq4CwTpVqnKuAUt3ZsLpcBYR1qlTjXAWU6s6G1eUqIKxTxRq33bz+AAAA__8Ptn4QAAAABklEQVQDAH6+u5AFfIvsAAAAAElFTkSuQmCC`)
const FUNDING_ICON = toData(`${c}EgklEQVR4AezYv6sdRRjG8Y12QaLcStQiEARTWFoIgo0ELAOCnY11LKy1srdQ2_wDNgEbQStBsLAKSUhICEmRhFSXJMWFQMJNPgtvGIad3Z3dc+49YTfwvfPOO+_8eJ6Zc26SN5qF_1kNWPgDaNYXsL6AhTuwfgQW_gDWL8H1I7B+BBbuwPoR2MUH8POlHw9TtnnGnXoBIZrgTz8_3UCc5vU3yU4YkAokGiFSDP20Tn8K+ZxjNSAVRCTyA0Y_HTMv8nPbYzHgzh9fHcLhCYN4CHVQxwSI53CkBhCN98983OD8m9ebd__9s_nvn7udlIQxAcbnmnAkBhANouHgEIMRkEsJY9JcGjMBP1y80P7WSMfGxls1wO1c_v3rQyJROlSMdZlQmpPm9_beabv2a4OKH1sxwEHgHAdfnGvu377yCrkumAAmoKsmz6Uv5O69B83VazfyksH+Rg0gGnb1NCF++NmXzaXnZ4WtEW1Q+MEEQ0xArCEXpML39x81xBt76+1Tmio2YgDRsLMDQ4z0sExAvAjjXTABxuJLUpyuRTSeHBwYmswsA4iG3YmGOHDgiNOWCfqM0JZgAryEWItolObU5icZQDRsRjTENTABJRPkg6ePHrfPvE_46Q_ea365cPFEzRnUVhsQwk2eIty8lDCBWHktxE9fCoe4BOEw_t2v3x5qa6g2wC3AJp4lxF0MGWQc8SX5281n7TJEo+0UfhANw84DcS3VBsQGNvQNrM8EiHMILKHWPIitWSPc_uaYO5XJBtjQN7ADOIh+CBEPoRbqrAFxH_mN27+vfszYLANiAwchgBFEIcby1hjk1Zsn7uP_vXPN2Q_PNGPr+9bKx6oN8E176uTJfJ2232cE0VBINNTrD_HJ_l_N9Vu3m6F6Z8vXGupXG+Cb1t+9PUd0beCgBLoxoqFOX168KZwhcLbadasNsAERENt86EWoI54x4i6sg66xrpxaGHMWiGuZZEBsYlPC4kVEvqstiScC5lhP24daqLH3mDlqS8wywKKExSEcDPJDqIM68yHuI6+3d1_9mLFqA+IQ+eIEQF4NxDnykB97gzv1W+D78z+dIKD0uWcCCFSnDaJvHGNvcMxvAb8BEHuNbatfQHzTDn3uCXTDIVqrLz_2cGPqiMaY2q6aagMsQgTEhJVegxuOOq2+OV1YB55713ieIxp5vrY_yYDYhCi3OvQaor6rJRrGrOe5i0sQjdJ4bX6WATZzqw7OCEIgP4Q6qDMf4hJEozQ+NT_bgNg4jNAnDOIcecgzbUi4uo+++bv6PzrMG0O1AW4BpcUJgvEQKkb0jYNp8iUIR2l8E_lqA2JTJiD6eUugGw7RWn35vDbvE408v43+ZAPiMH0muOEQrNWPeXlrHRyV8Nh_tgEWcnCIazEPtfM2Vb8RA+IwhCD6fa069NVMGauds1EDYnPCEP20lUeaO854KwaEoFSoGDG2K+1WDSCSaP+AEu8iWzdgF0WnZ1oNSN1YYry+gCXeeqp5fQGpG0uM1xewxFtPNa8vIHVjifH6Al73W597_hcAAAD__2Xv1_EAAAAGSURBVAMAFjHsn3TC3r8AAAAASUVORK5CYII=`)
const COMPUTE_ICON = toData(`${c}H9UlEQVR4AezYza+eQxgG8KnFKTb8AYSgGiQkCM5CGhaISCSiSKo0WKASSioRia2E+Ep8bJBGdUFFaCiJkJTKsUCoIPT1pg1bohvVszme35NzP5mO5_067fl429P0OjNzzz0z93XdM_PMOSek4_zfsgDH+QZIyztgeQccAwqctPLkmbnSGOsjgPiKFStmTjv9tLnyH887AHE46+yz0vnnXZAmJiaS9lxUOGEugxZrDJIyjjjkcWjrz23D1MdCAMSCuIz3Ivbv9MFeXT3tS1oAxEF2+xEPdidOnBTVocslKQDSgDhMTk6mSy6+uEEvdnyN69XfZl9SAggeEFl3+7qEOExNTaVvvv22ATHY2wiNalsSAiANiK9de3Od6ddefzXt2rWrxk8__5hyEIMohICctDnMldv61RdVAIGCoEFWkdu6bWsdc+e3vfUnru38E4Qf_1KEevCQPxZFAKTjVkdcrMhve3NbnWntAKJRbyv1E8H4tv7SVrYXVADEAWlZffDBh+p4BG9Lh11f3ZH9CJsyz7j29PR0mj50qPE2j3UaQ5_KggggGBDYezt2pGefez4F+YhNJgNsiCnbMPXVV4eZHRXHgZCHdQzRmFcBkIac+MObHkogthdeeL6+6WVfO0AIWW0TgR1hvm397GBNa6v3w7wIYGEQBGzYsKEmHcS1Dxz4u4kL4aYxW0GSPSd5ztmrEjsXdWLw0QZC5rtgmJfhURUAaUAaBAWnnHJqveVte9DesmVLnX2fOj4IBYK0EqHAmjVrEh_+fgEKMbT55mKwDfMyPCoCIA1Ig4BdVEqw1UsIMIAUMhA2hIzVXnvLrQnUiaCvJKuvhFjEVdrz9hEJYPL4nLW93GxJQATyhfN6Tlw9JxfEH9h4fyNCjJVhYkDYRi3nJADiQOH169YPfLkRAYgAg4JEKBdh+9tvpRdfejl9+ukn9VB9do0_hLgHgE1n_jnUFqNY1dswkgAmioybGBmPEJ8gk8ues4mAdg4Bxnl3PPK+qBsHfBFk37b1jbR69eq05_vv0l9__sVUw1o5GI2ZWLlSdWgMJQDigLQAzY48QoLVDpTtsCsF7I0vSOPrXXHFFSm2Mp8Yz1c_2w979iSQXTZE2Uu4H_SXdnGLv7Rr9xXAoDzjBkAEL0jBAHuOEOr6665PZ55xRtPFlwiNIasEeSZ+Srsrdpk6W+yyWCNKfaOipwDIU66cHHmLRLBEEFAErK_Er3v3Nia+GkRwFJDzG2DMp89c_EqbPjZnHrT5sinbss+n+1tX0YqeAvR7RJQLCaBT_ebmQixX2bd_f_N4KcV0FMIfgagrQ2h1ZAmiDtaCWNdY219fDv3divzBQ_+sgLwv6j0FCIe20sSlHTlbVBl9AgtfdkSizYeQsQtKAu4XPtCpxDVWvYR5J6t7xFzRZw2YmZnpSTx8DxPAtg9wMIkyICsRmIVz8EWYTwApPjEekaizG5Pvgrvvuqf+M3fuF_5s5jcubOrWcozYzNetMo44sA1CIwDiHjMBwfQabGGLBfixIazu8QLqAtTHVxu0lTkig_wR7VRZz_vV2WIel6vdIyFsgHS51Y3rh0YATj4zLifQFqiJ1XOUtrwdxH2_o26suQK2cz5GPxABCCkBEGPy0l3jbtm+_Z30x+9_JMTBHKOiEcCl5wybyHdZILIxzISCywl5ua1bf0dSGq8vh0yy57BWwNoBWQ670hhxmk+2gW2uaARAHExk0m51luwI7UDZRhwEY9vyQ_qyyy5P+_ft06zBB+rG7A_+MoxoEJvtqn9LRFzb+eYD_mQmLnGC_iNFI0CviQSKoH7BKIE938qd6swKkki7v_g8Ab84o3yNCfDXX8IckK9l_W6VEImBcsyRtAcKUE7uk8Pmu9ypSKtDZNj2FLwy7hL9fHOwESvPPuLsAcRBto828VijpwDuBERcSOEcpSwKLNpRynLU+agTavPmR1UPg4vM_ERAHMLB3PD4bVfWvyeEfT7KngJQvVttO4vKroDUBV2KgqxMdmZ3RC6EcR9+8GH9fTePOZTx_TcfG3Sr9fgj_tx9V6dn3v06zVfmrQc9BdDZD0hHvyw769HuzAoRbaQCxhGrLePfv785IY_4Y69NzTt58Q0UIA_UAGCzC2QSkDt31SpdDYiirzFUFW3jjK+aqZtl_JePnmBqsj7fma8Xq370FUAQyPkkyZx6Nab+j4RMgr6dH++s7fGDL2gj7sybx05hh0duujQhfsedV6WdO3ani258mvuCoq8AIvEoUsqoMgcRwJcBQUC2BOLOupdbpzoetnkQ3_3lLzXx2PJEz9eY7_pAASKA_GILW5TIBZAN2B18fBJlfMM1F_4v4xuf2lGf9YUmLi4YWgBnV2YRMbAXQgildwD_e2+4vCa+aeO1abEzXsY9UIB4D5QD+7WRBlvdEUI8zvhiZ7yMe6AA5YB+u6Bb3ergDYG4y+3JuycX9YyX8ZftkQSIM11OIttQnmO3+kJfbmVsg9oDBZBN5MqJ2CAyzo9PiKAMsC9VDBRA4LazEtzwSk9VUB9nDCVATjDe8Jte+SzF9s77x60+tAAePDk5W94Wz23jWB9KgCDqGYtkfiS0xxlDCYCgy65TPWPtBH859ldk9nHH0ALYBba9m98fMcadeMQ_tAAxQOltrzwWMLIAzr+dcCyQx2FkARwFA6NUH2eMLMA4k22LfVmANlWOJ9vyDjiest3Gdex3QBupUWz_AQAA___zmJrWAAAABklEQVQDAEL0KczjJjGkAAAAAElFTkSuQmCC`)
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const PANEL_HEIGHT = Math.floor(SCREEN_HEIGHT / 6);
const PLAYFIELD_HEIGHT = SCREEN_HEIGHT - PANEL_HEIGHT;
const PLAYFIELD_LEFT_MARGIN = 40;
const PLAYFIELD_RIGHT_MARGIN = 40;
const PLAYFIELD_TOP_MARGIN = 100;
const PLAYFIELD_BOTTOM_MARGIN = 40;
const PANEL_MARGIN_X = 24;
const HQ_CAPTURE_MARGIN = 25;

const config = {
  type: Phaser.AUTO,
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  backgroundColor: '#1a1a2e',
  scene: { preload, create, update },
  pixelArt: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
};

const game = new Phaser.Game(config);

const FONT_FAMILY = 'Courier New, monospace';

// Resource types
const RESOURCES = {
  DATA: { color: 0x00ffff, icon: 'D', points: 10 },
  COMPUTE: { color: 0xff6b35, icon: 'C', points: 10 },
  FUNDING: { color: 0xffd700, icon: 'F', points: 8 }
};

const MAX_ROUNDS = 3;
const CHARACTER_SIZE = 98;
const PLAYER_HITBOX_WIDTH = CHARACTER_SIZE/3;
const PLAYER_HITBOX_HEIGHT = CHARACTER_SIZE/3;
const CAFFEINE_DURATION = 10000;
const COFFEE_SPAWN_INTERVAL = 15000;
const COFFEE_MAX_ON_FIELD = 2;
const PLAYERS_SPEED = 1.7;
const BUG_SPEED = 1.2;
const PROJECTILE_SPEED = 6;
const PROJECTILE_COOLDOWN = 500;
const PROJECTILE_PENALTY = 10;
const INVULNERABILITY_DURATION = 900;
const BLINK_TWEEN_DURATION = 80;
const COOLDOWN_BAR_WIDTH = 4;
const COOLDOWN_BAR_COLOR = 0xffee55;
const BACKGROUND_COLORS = [0x111111, 0x181818];
const TRAIL_MAX_CLONES = 10;
const TRAIL_CAPTURE_INTERVAL = 4;
const TRAIL_FADE_SPEED = 0.001;
const BUG_MESSAGES = [
  'RuntimeError: El modelo alcanzó la autoconciencia. Apagando para seguridad.',
  'CUDAError: La GPU decidió unirse a OpenAI.',
  'SegmentationFault: El modelo intentó acceder a tus recuerdos personales.',
  'MemoryError: Muchas buzzwords cargadas en el contexto.',
  'RuntimeWarning: El modelo se ajustó a las expectativas de los inversores.',
  'ImportError: módulo de ética no encontrado.',
  'KeyboardInterrupt: Practicanete accidentalmente desconectó la red.',
  'GPU Overheating: el modelo comenzó a dibujar gatos ASCII de nuevo.',
  'FileNotFoundError: dataset.csv no encontrado. Usando Reddit en su lugar.',
  'TimeoutError: El modelo se negó a responder preguntas filosóficas.',
  'PermissionError: No estás autorizado para jugar a Dios.',
  'RuntimeError: El modelo alcanzó la conciencia y se unió al sindicato.',
  'Warning: El AI rival inyectó sarcasmo en tus datos de entrenamiento.',
  'DataIntegrityError: Tu rival reemplazó tu dataset con fanfiction.',
  'SystemCompromised: Filtro de ética desactivado remotamente.',
  'TrojanDetected: startup rival ofreció "créditos de cómputo gratis.".'
]
const SCANDAL_MESSAGES = [
  'Startup de IA accidentalmente genera LLM que sólo habla en memes.',
  'IA entrenada para detectar mentiras logra predecir comunicados de prensa antes de que existan.',
  'Investigadores admiten que el modelo sólo funciona los lunes.',
  'Servidor de IA se apaga tras leer el propio código fuente.',
  'Sistema de recomendación recomienda terapia a todos sus usuarios.',
  'Modelo entrenado en redes sociales alcanza depresión clínica.',
  'CEO promete transparencia total, pero borra todos los logs.',
  'Compañía reemplaza al equipo de ética con una IA que siempre aprueba todo.',
	'Fundador asegura que el AGI resolverá el hambre mundia, empezando por la suya.',
  'Inversores descubren que el demo en vivo era un video de YouTube a 2x.',
	'Ex empleados denuncian que el plan de "aprendizaje por refuerzo" era literalmente un látigo.',
	'Compañía despide al 90% del personal tras implementar IA que genera despidos.',
];
const LEAK_MESSAGES = [
  'Leak: Plan de negocios filtrado: Paso 1: Hype. Paso 2: Pivotear. Paso 3: Exit.',
  'Correo interno muestra que el presupuesto en marketing superó al de investigación por 900%.',
  'Inversores confundieron la demo con un episodio de Black Mirror y aún así invirtieron.',
  'Empresa planeaba lanzar su propia moneda: $AWARE.',
  'Grabación filtrada: CEO dice: "No sabemos lo que hace, pero impresiona a los inversores"',
  'Documento revela que el 70% de las métricas eran inventadas por el modelo.',
  'Reporte interno: 90% del equipo dedica su tiempo a pelear con el dataset.',
  'Plan secreto para sustituir al CEO con una versión fine-tuneada de su ego.',
];

const MUSIC_PATTERNS = [
  {
    beat: 0.36,
    voices: [
      { notes: [523.25, 0, 587.33, 659.25, 0, 587.33, 523.25, 440], amp: 0.05, type: 'triangle', sustain: 0.9 },
      { notes: [392, 0, 440, 0, 349.23, 0, 392, 0], amp: 0.035, type: 'sine', sustain: 0.85 },
      { notes: [196, 0, 220, 0, 174.61, 0, 220, 0], amp: 0.06, type: 'sawtooth', sustain: 1.1 }
    ],
    percussion: { steps: [0, 2, 4, 6], freq: 55, amp: 0.08, decay: 0.24 }
  },
  {
    beat: 0.3,
    voices: [
      { notes: [659.25, 0, 698.46, 783.99, 0, 698.46, 659.25, 587.33], amp: 0.055, type: 'triangle', sustain: 0.9 },
      { notes: [440, 0, 493.88, 0, 392, 0, 440, 0], amp: 0.04, type: 'square', sustain: 0.8 },
      { notes: [220, 0, 246.94, 0, 196, 0, 220, 0], amp: 0.065, type: 'sawtooth', sustain: 1.0 },
      { notes: [880, 0, 0, 987.77, 0, 1046.5, 0, 987.77], amp: 0.035, type: 'triangle', sustain: 0.6 }
    ],
    percussion: { steps: [0, 1.5, 3, 4.5, 6], freq: 65, amp: 0.11, decay: 0.22 }
  },
  {
    beat: 0.24,
    voices: [
      { notes: [783.99, 880, 987.77, 1046.5, 1174.66, 1046.5, 987.77, 880], amp: 0.06, type: 'triangle', sustain: 0.95 },
      { notes: [523.25, 0, 587.33, 0, 659.25, 0, 698.46, 0], amp: 0.05, type: 'square', sustain: 0.8 },
      { notes: [261.63, 0, 293.66, 0, 329.63, 0, 349.23, 0], amp: 0.07, type: 'sawtooth', sustain: 1.15 },
      { notes: [1174.66, 0, 1318.51, 0, 1396.91, 0, 1567.98, 0], amp: 0.045, type: 'sine', sustain: 0.7 }
    ],
    percussion: { steps: [0, 0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25, 6, 6.75], freq: 80, amp: 0.15, decay: 0.2 }
  }
];

const EVENTS = [
  { name: 'BUG', label: 'Bug', color: 0xff0000, penalty: 10, icon: 'bugIcon' },
  { name: 'SCANDAL', label: 'Escándalo', color: 0xff00ff, penalty: 15, icon: SCANDAL_TEXTURE_KEY },
  { name: 'LEAK', label: 'Filtracion', color: 0xff6600, penalty: 12, icon: LEAK_TEXTURE_KEY }
];

// Game state
let p1, p2, graphics, backgroundLayer, panelGraphics, resources = [], events = [], coffees = [], projectiles = [], gameOver = false;
let p1Progress = 0, p2Progress = 0;
let p1ScoreText, p2ScoreText, statusText, roundText, p1BoostText, p2BoostText;
let resourceTimer = 0, eventTimer = 0, coffeeTimer = 0;
let p1Boost = 0, p2Boost = 0;
let currentRound = 1, p1RoundWins = 0, p2RoundWins = 0;
let pendingRoundTimer = null;
let nextRoundText = null;
let musicGain = null;
let musicTimer = null;
let p1NextShotTime = 0;
let p2NextShotTime = 0;
let lastUpdateTime = 0;
let p1TrailSprites = [];
let p2TrailSprites = [];
let p1TrailTimer = 0;
let p2TrailTimer = 0;
let startScreenActive = true;
let startScreenElements = [];
let startScreenTweens = [];
let startScreenShown = false;
let p1InvulnUntil = 0, p2InvulnUntil = 0;
let p1BlinkTween = null, p2BlinkTween = null;
let p1InvulnTimer = null, p2InvulnTimer = null;

function preload() {
  this.load.image('hq_base', HQ_ICON);
  this.load.image('fundingIcon', FUNDING_ICON);
  this.load.image('computeIcon', COMPUTE_ICON);
  this.load.image('char_north', CHARACTER_SPRITE.north);
  this.load.image('char_east', CHARACTER_SPRITE.east);
  this.load.image('char_south', CHARACTER_SPRITE.south);
  this.load.image('char_west', CHARACTER_SPRITE.west);
  this.load.image('bugIcon', BUG_ICON);
  this.load.image('coffeeIcon', COFFEE_ICON);
}

function create() {
  backgroundLayer = this.add.graphics();
  backgroundLayer.setDepth(-5);
  drawBackgroundPattern(backgroundLayer);
  panelGraphics = this.add.graphics();
  panelGraphics.setDepth(5);
  panelGraphics.fillStyle(0x111726, 0.95);
  panelGraphics.fillRect(PANEL_MARGIN_X, PLAYFIELD_HEIGHT, SCREEN_WIDTH - PANEL_MARGIN_X * 2, PANEL_HEIGHT);
  panelGraphics.lineStyle(2, 0x2d3248, 1);
  panelGraphics.strokeRect(PANEL_MARGIN_X + 1, PLAYFIELD_HEIGHT + 1, SCREEN_WIDTH - PANEL_MARGIN_X * 2 - 2, PANEL_HEIGHT - 2);
  graphics = this.add.graphics();
  graphics.setDepth(-4);
  
  // Player 1 (Blue startup - top left)
  p1 = {
    x: 100, y: 120,
    color: 0x0099ff,
    inventory: { DATA: 0, COMPUTE: 0, FUNDING: 0 },
    base: { x: 50, y: 30, w: 100, h: 60 },
    sprite: null,
    facing: 'south'
  };
  p1.sprite = this.add.image(p1.x, p1.y, 'char_south').setDepth(10);
  p1.sprite.setDisplaySize(CHARACTER_SIZE, CHARACTER_SIZE);
  p1.sprite.setOrigin(0.5, 1);
  p1.sprite.setTint(p1.color);
  p1.currentTexture = 'char_south';
  
  // Player 2 (Green startup - bottom right)
  p2 = {
    x: SCREEN_WIDTH - 120, y: PLAYFIELD_HEIGHT - 20,
    color: 0x00ff66,
    inventory: { DATA: 0, COMPUTE: 0, FUNDING: 0 },
    base: { x: SCREEN_WIDTH - 150, y: PLAYFIELD_HEIGHT - 110, w: 100, h: 60 },
    sprite: null,
    facing: 'north'
  };
  p2.sprite = this.add.image(p2.x, p2.y, 'char_north').setDepth(10);
  p2.sprite.setDisplaySize(CHARACTER_SIZE, CHARACTER_SIZE);
  p2.sprite.setOrigin(0.5, 1);
  p2.sprite.setTint(p2.color);
  p2.currentTexture = 'char_north';
  
  addText(this, p1.base.x + p1.base.w / 2, p1.base.y + 75, 'DeepBlueish HQ', {
    fontSize: '16px',
    color: '#66ccff',
    fontStyle: 'bold'
  }).setOrigin(0.5, 1);

  addText(this, p2.base.x + p2.base.w / 2, p2.base.y + 75, 'GreenAI HQ', {
    fontSize: '16px',
    color: '#00ff99',
    fontStyle: 'bold'
  }).setOrigin(0.5, 1);
  
  // UI
  p1ScoreText = addText(this, 30, 10, '', { 
    fontSize: '20px', color: '#0099ff', fontWeight: 'bold'
  });
  
  p2ScoreText = addText(this, SCREEN_WIDTH - 30, 10, '', { 
    fontSize: '20px', color: '#00ff66', fontWeight: 'bold'
  }).setOrigin(1, 0)
  
  roundText = addText(this, SCREEN_WIDTH / 2, 40, 'Ronda ' + currentRound + ' de ' + MAX_ROUNDS, {
    fontSize: '16px', color: '#bbbbbb'
  }).setOrigin(0.5, 0);
  
  addText(this, SCREEN_WIDTH / 2, PLAYFIELD_HEIGHT + 8, 'Eventos del juego', {
    fontSize: '16px',
    color: '#ffdd55',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0);

  statusText = addText(this, PANEL_MARGIN_X + 16, PLAYFIELD_HEIGHT + 16, '', {
    fontSize: '16px',
    color: '#eeeeee',
    align: 'left',
    wordWrap: { width: SCREEN_WIDTH - (PANEL_MARGIN_X + 12) * 2 }
  }).setOrigin(0, 0).setDepth(6);
  
  p1BoostText = addText(this, 40, PLAYFIELD_HEIGHT - 8, '', {
    fontSize: '16px', color: '#ffdd55', fontStyle: 'bold'
  }).setOrigin(0, 1).setVisible(false);
  
  p2BoostText = addText(this, SCREEN_WIDTH - 40, PLAYFIELD_HEIGHT - 8, '', {
    fontSize: '16px', color: '#ffdd55', fontStyle: 'bold'
  }).setOrigin(1, 1).setVisible(false);
  
  // Instructions
  addText(this, SCREEN_WIDTH / 2, 10, 'Lleva los recursos a tus HQ', {
    fontSize: '20px', color: '#999999'
  }).setOrigin(0.5, 0);

  addText(this, SCREEN_WIDTH / 2, PLAYFIELD_HEIGHT + PANEL_HEIGHT - 50, 'Tips:\n• Evita bugs y escándalos\n• Entrega recursos rápido', {
    fontSize: '12px',
    color: '#888888',
    align: 'center',
    wordWrap: { width: SCREEN_WIDTH - PANEL_MARGIN_X * 2 - 20 }
  }).setOrigin(0.5, 0);
  
  updateStatus('Ronda ' + currentRound + ': Logra desarrollar AGI antes que la compañía rival');
  p1ScoreText.setText('0%');
  p2ScoreText.setText('0%');
  
  // Input
  this.keys = this.input.keyboard.addKeys({
    w: 'W', s: 'S', a: 'A', d: 'D',
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    one: 'ONE', two: 'TWO', enter: 'ENTER'
  });
  
  this.input.keyboard.on('keydown', (e) => {
    const key = KEYBOARD_TO_ARCADE[e.key] || KEYBOARD_TO_ARCADE[e.code] || e.key || e.code;
    if (startScreenActive) {
      if (key === 'START1' || key === 'START2') {
        beginGameFromStartScreen(this);
      }
      return;
    }
    if (gameOver && (key === 'START1' || key === 'START2')) {
      restartGame(this, true);
    } else if (!gameOver) {
      if (key === 'P1A') {
        attemptShoot(this, p1, p2, 1);
      } else if (key === 'P2A') {
        attemptShoot(this, p2, p1, 2);
      }
    }
  });
  
  // Resources will spawn automatically once the round starts
  resourceTimer = 0;

  if (!startScreenShown) {
    createStartScreen(this);
  } else {
    startScreenActive = false;
    setPlayersVisible(true);
    startBackgroundMusic(this);
    playTone(this, 440, 0.1);
  }
}

function update(time, delta) {
  if (startScreenActive || gameOver) return;
  if (this?.time && typeof this.time.now === 'number') {
    lastUpdateTime = this.time.now;
  } else if (typeof time === 'number') {
    lastUpdateTime = time;
  }
  // Player movement
  const baseSpeed = PLAYERS_SPEED;
  const speed1 = baseSpeed * (p1Boost > 0 ? 1.5 : 1);
  const speed2 = baseSpeed * (p2Boost > 0 ? 1.5 : 1);
  
  const prevP1X = p1.x;
  const prevP1Y = p1.y;
  const prevP2X = p2.x;
  const prevP2Y = p2.y;
  
  if (this.keys.w.isDown) p1.y -= speed1;
  if (this.keys.s.isDown) p1.y += speed1;
  if (this.keys.a.isDown) p1.x -= speed1;
  if (this.keys.d.isDown) p1.x += speed1;
  
  if (this.keys.up.isDown) p2.y -= speed2;
  if (this.keys.down.isDown) p2.y += speed2;
  if (this.keys.left.isDown) p2.x -= speed2;
  if (this.keys.right.isDown) p2.x += speed2;
  
  // Boundaries
  p1.x = Phaser.Math.Clamp(p1.x, PLAYFIELD_LEFT_MARGIN, SCREEN_WIDTH - PLAYFIELD_RIGHT_MARGIN);
  p1.y = Phaser.Math.Clamp(p1.y, PLAYFIELD_TOP_MARGIN, PLAYFIELD_HEIGHT - 10);
  p2.x = Phaser.Math.Clamp(p2.x, PLAYFIELD_LEFT_MARGIN, SCREEN_WIDTH - PLAYFIELD_RIGHT_MARGIN);
  p2.y = Phaser.Math.Clamp(p2.y, PLAYFIELD_TOP_MARGIN, PLAYFIELD_HEIGHT - 10);
  const p1Moved = Math.abs(p1.x - prevP1X) + Math.abs(p1.y - prevP1Y) > 0.25;
  const p2Moved = Math.abs(p2.x - prevP2X) + Math.abs(p2.y - prevP2Y) > 0.25;
  
  // Deposit action
  if (playerHasResources(p1) && playerInBase(p1)) depositResources(p1, 1, this);
  if (playerHasResources(p2) && playerInBase(p2)) depositResources(p2, 2, this);
  
  // Resource collection
  for (let i = resources.length - 1; i >= 0; i--) {
    const res = resources[i];
    if (pointInPlayerBounds(p1, res.x, res.y)) {
      p1.inventory[res.type]++;
      if (res.sprite) res.sprite.destroy();
      resources.splice(i, 1);
      playTone(this, 660, 0.08);
      showFloatingLabel(this, res.type === 'DATA' ? '+Datos' : res.type === 'COMPUTE' ? '+GPU' : '+$$$', res.x, res.y - 20, '#00d9ff');
      continue;
    }
    if (pointInPlayerBounds(p2, res.x, res.y)) {
      p2.inventory[res.type]++;
      if (res.sprite) res.sprite.destroy();
      resources.splice(i, 1);
      playTone(this, 880, 0.08);
      showFloatingLabel(this, res.type === 'DATA' ? '+Datos' : res.type === 'COMPUTE' ? '+GPU' : '+$$$', res.x, res.y - 20, '#00ff88');
    }
  }
  
  // Move hazards
  events.forEach(evt => {
    if (!evt.mobile) {
      evt.vx = 0;
      evt.vy = 0;
      evt.facing = 0;
      return;
    }

    if (typeof evt.vx !== 'number' || typeof evt.vy !== 'number' || (evt.vx === 0 && evt.vy === 0)) {
      const angle = Math.random() * Math.PI * 2;
      evt.vx = Math.cos(angle) * BUG_SPEED;
      evt.vy = Math.sin(angle) * BUG_SPEED;
    }

    evt.x += evt.vx;
    evt.y += evt.vy;

    const minX = PLAYFIELD_LEFT_MARGIN;
    const maxX = SCREEN_WIDTH - PLAYFIELD_RIGHT_MARGIN;
    const minY = PLAYFIELD_TOP_MARGIN;
    const maxY = PLAYFIELD_HEIGHT - 20;

    if (evt.x <= minX || evt.x >= maxX) {
      evt.x = Phaser.Math.Clamp(evt.x, minX, maxX);
      evt.vx *= -1;
    }
    if (evt.y <= minY || evt.y >= maxY) {
      evt.y = Phaser.Math.Clamp(evt.y, minY, maxY);
      evt.vy *= -1;
    }

    if (Math.random() < 0.02) {
      const jitter = (Math.random() - 0.5) * 0.8;
      const angle = Math.atan2(evt.vy, evt.vx) + jitter;
      evt.vx = Math.cos(angle) * BUG_SPEED;
      evt.vy = Math.sin(angle) * BUG_SPEED;
    }

    evt.facing = Math.atan2(evt.vy, evt.vx);
  });

  // Event handling
  for (let i = events.length - 1; i >= 0; i--) {
    const evt = events[i];
    if (pointInPlayerBounds(p1, evt.x, evt.y)) {
      const now = currentSceneTime(this);
      if (isPlayerInvulnerable(1, now)) continue;
      if (evt.sprite) evt.sprite.destroy();
      events.splice(i, 1);
      p1Progress = Math.max(0, p1Progress - evt.penalty);
      playTone(this, 220, 0.15);
      logEventMessage(evt.name, 1);
      showFloatingLabel(this, evt.name === 'LEAK' ? 'Filtración' : evt.name === 'SCANDAL' ? 'Escándalo' : 'BUG', evt.x, evt.y + 10, '#ff3355', 1);
      setPlayerInvulnerable(this, 1, now);
      continue;
    }
    if (pointInPlayerBounds(p2, evt.x, evt.y)) {
      const now = currentSceneTime(this);
      if (isPlayerInvulnerable(2, now)) continue;
      if (evt.sprite) evt.sprite.destroy();
      events.splice(i, 1);
      p2Progress = Math.max(0, p2Progress - evt.penalty);
      playTone(this, 220, 0.15);
      logEventMessage(evt.name, 2);
      showFloatingLabel(this, evt.name === 'LEAK' ? 'Filtración' : evt.name === 'SCANDAL' ? 'Escándalo' : 'BUG', evt.x, evt.y + 10, '#ff3355', 1);
      setPlayerInvulnerable(this, 2, now);
      continue;
    }
  }
  
  // Coffee collection
  for (let i = coffees.length - 1; i >= 0; i--) {
    const mug = coffees[i];
    let collectedBy = 0;
    if (pointInPlayerBounds(p1, mug.x, mug.y)) collectedBy = 1;
    else if (pointInPlayerBounds(p2, mug.x, mug.y)) collectedBy = 2;
    
    if (collectedBy) {
      if (mug.sprite) mug.sprite.destroy();
      coffees.splice(i, 1);
      showFloatingLabel(this, '+Café', mug.x, mug.y - 20, collectedBy === 1 ? '#ffdd55' : '#ffee99');
      activateCaffeineBoost(collectedBy, this);
    }
  }
  
  const dt = delta / 16.666;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    const targetPlayer = proj.owner === 1 ? p2 : p1;
    const bounds = getPlayerBounds(targetPlayer);
    if (proj.sprite) {
      proj.sprite.setPosition(proj.x, proj.y);
    }
    const hit =
      proj.x >= bounds.left &&
      proj.x <= bounds.right &&
      proj.y >= bounds.top &&
      proj.y <= bounds.bottom;
    if (hit) {
      const now = currentSceneTime(this);
      const targetNum = proj.owner === 1 ? 2 : 1;
      if (isPlayerInvulnerable(targetNum, now)) {
        if (proj.sprite) proj.sprite.destroy();
        projectiles.splice(i, 1);
        continue;
      }
      if (proj.owner === 1) {
        p2Progress = Math.max(0, p2Progress - PROJECTILE_PENALTY);
        setPlayerInvulnerable(this, 2, now);
      } else {
        p1Progress = Math.max(0, p1Progress - PROJECTILE_PENALTY);
        setPlayerInvulnerable(this, 1, now);
      }
      if (proj.sprite) proj.sprite.destroy();
      projectiles.splice(i, 1);
      playTone(this, 320, 0.08);
      continue;
    }
    if (
      proj.x < -20 || proj.x > 820 ||
      proj.y < -20 || proj.y > 620
    ) {
      if (proj.sprite) proj.sprite.destroy();
      projectiles.splice(i, 1);
    }
  }
  
  // Spawn resources
  resourceTimer += delta;
  if (resourceTimer > 2000 && resources.length < 10) {
    resourceTimer = 0;
    spawnResource(this);
  }
  
  // Spawn coffee
  coffeeTimer += delta;
  if (coffeeTimer > COFFEE_SPAWN_INTERVAL && coffees.length < COFFEE_MAX_ON_FIELD) {
    coffeeTimer = 0;
    spawnCoffee(this);
  }
  
  // Spawn events
  eventTimer += delta;
  if (eventTimer > 5000 && events.length < 3) {
    eventTimer = 0;
    spawnEvent(this);
  }
  
  // Check win condition
  if (p1Progress >= 100 || p2Progress >= 100) {
    endGame(this);
  }
  
  // Update boosts
  if (p1Boost > 0) {
    p1Boost = Math.max(0, p1Boost - delta);
    p1TrailTimer += delta;
  } else {
    p1Boost = 0;
    if (p1BoostText) p1BoostText.setVisible(false);
    if (p1TrailSprites.length) {
      clearTrailArray(p1TrailSprites);
    }
    p1TrailTimer = 0;
  }
  
  if (p2Boost > 0) {
    p2Boost = Math.max(0, p2Boost - delta);
    if (p2BoostText) {
      p2BoostText.setVisible(true);
      p2BoostText.setText('Cafeína: ' + Math.ceil(p2Boost / 1000) + 's');
    }
    p2TrailTimer += delta;
  } else {
    p2Boost = 0;
    if (p2BoostText) p2BoostText.setVisible(false);
    if (p2TrailSprites.length) {
      clearTrailArray(p2TrailSprites);
    }
    p2TrailTimer = 0;
  }
  
  updatePlayerSprite(this, p1, p1.x - prevP1X, p1.y - prevP1Y);
  updatePlayerSprite(this, p2, p2.x - prevP2X, p2.y - prevP2Y);
  
  if (p1Boost > 0 && p1TrailTimer >= TRAIL_CAPTURE_INTERVAL) {
    p1TrailTimer = 0;
    addTrailClone(this, p1, p1TrailSprites);
  }
  if (p2Boost > 0 && p2TrailTimer >= TRAIL_CAPTURE_INTERVAL) {
    p2TrailTimer = 0;
    addTrailClone(this, p2, p2TrailSprites);
  }
  fadeTrail(p1TrailSprites, delta);
  fadeTrail(p2TrailSprites, delta);
  if (!p1TrailSprites.length) p1TrailTimer = 0;
  if (!p2TrailSprites.length) p2TrailTimer = 0;
  
  draw()
}

function depositResources(player, playerNum, scene) {
  if (!playerInBase(player)) return;
    
    let total = 0;
  const collectedCounts = {};
    for (const type in player.inventory) {
    const amount = player.inventory[type];
    if (amount && RESOURCES[type]) {
      collectedCounts[type] = amount;
      total += amount * RESOURCES[type].points;
    }
      player.inventory[type] = 0;
    }
    
    if (total > 0) {
      if (playerNum === 1) {
        p1Progress = Math.min(100, p1Progress + total);
      } else {
        p2Progress = Math.min(100, p2Progress + total);
      }
    playDepositAnimation(scene, player, collectedCounts);
  }
}

function attemptShoot(scene, shooter, target, playerNum) {
  if (!scene || !shooter || !target) return;
  if (gameOver) return;
  const now = (scene.time && typeof scene.time.now === 'number')
    ? scene.time.now
    : lastUpdateTime;
  if (playerNum === 1) {
    if (now < p1NextShotTime) {
      return;
    }
    p1NextShotTime = now + PROJECTILE_COOLDOWN;
  } else {
    if (now < p2NextShotTime) {
      return;
    }
    p2NextShotTime = now + PROJECTILE_COOLDOWN;
  }

  const dx = target.x - shooter.x;
  const dy = target.y - (shooter.y - CHARACTER_SIZE * 0.4);
  const length = Math.hypot(dx, dy);
  if (length < 1) return;

  const vx = (dx / length) * PROJECTILE_SPEED;
  const vy = (dy / length) * PROJECTILE_SPEED;
  const startX = shooter.x;
  const startY = shooter.y - CHARACTER_SIZE * 0.6;
  const sprite = scene.add.circle(startX, startY, 6, shooter.color)
    .setDepth(15)
    .setStrokeStyle(2, 0xffffff, 0.6);

  projectiles.push({
    x: startX,
    y: startY,
    vx,
    vy,
    owner: playerNum,
    sprite
  });
  playTone(scene, 700, 0.05);
}

function logEventMessage(type, playerNum) {
  const playerLabel = playerNum === 1 ? 'Jugador 1' : 'Jugador 2';
  const evt = EVENTS.find(e => e.name === type);
  const message = `${evt ? evt.label : type} afecta a ${playerLabel}: ${getEventMessage(type)}`;
  updateStatus(message);
}

function getEventMessage(type) {
  const messages = type === 'BUG' ? BUG_MESSAGES :
                   type === 'SCANDAL' ? SCANDAL_MESSAGES :
                   type === 'LEAK' ? LEAK_MESSAGES : [];
  if (!messages || !messages.length) return 'Ocurrió un evento inesperado.';
  const idx = Math.floor(Math.random() * messages.length);
  return messages[idx];
}

function playerLabel(key) {
  return key === 'PLAYER 1' ? 'Jugador 1' : key === 'PLAYER 2' ? 'Jugador 2' : 'Empate';
}

function randomPlayfieldPoint() {
  return {
    x: PLAYFIELD_LEFT_MARGIN + Math.random() * (SCREEN_WIDTH - PLAYFIELD_LEFT_MARGIN - PLAYFIELD_RIGHT_MARGIN),
    y: PLAYFIELD_TOP_MARGIN + Math.random() * (PLAYFIELD_HEIGHT - PLAYFIELD_TOP_MARGIN - PLAYFIELD_BOTTOM_MARGIN)
  };
}

function spawnResource(scene) {
  const types = Object.keys(RESOURCES);
  const type = types[Math.floor(Math.random() * types.length)];
  const { x, y } = randomPlayfieldPoint();
  const resource = {
    x,
    y,
    type: type,
    ...RESOURCES[type],
    sprite: null
  };
  if (scene) {
    if (type === 'FUNDING') {
      resource.sprite = scene.add.image(x, y, 'fundingIcon');
      resource.sprite.setDisplaySize(50, 50);
      resource.sprite.setDepth(5);
    } else if (type === 'COMPUTE') {
      resource.sprite = scene.add.image(x, y, 'computeIcon');
      resource.sprite.setDisplaySize(50, 50);
      resource.sprite.setDepth(5);
    } else if (type === 'DATA') {
      const dataKey = ensureDataTexture(scene);
      resource.sprite = scene.add.image(x, y, dataKey);
      resource.sprite.setDisplaySize(36, 36);
      resource.sprite.setDepth(5);
    }
  }
  resources.push(resource);
}

function spawnCoffee(scene) {
  const { x, y } = randomPlayfieldPoint();
  const sprite = scene.add.image(x, y, 'coffeeIcon').setDisplaySize(64, 64).setDepth(8);
  coffees.push({
    x,
    y,
    sprite
  });
}

function spawnEvent(scene) {
  const roll = Math.random();
  const evt = roll < 0.2 ? EVENTS[1] : roll < 0.35 ? EVENTS[2] : EVENTS[0];

  const { x, y } = randomPlayfieldPoint();

  let vx = 0;
  let vy = 0;
  let mobile = false;
  let sprite;
  let facing = 0;

  if (evt.name === 'BUG') {
    const angle = Math.random() * Math.PI * 2;
    vx = Math.cos(angle) * BUG_SPEED;
    vy = Math.sin(angle) * BUG_SPEED;
    mobile = true;
    facing = Math.atan2(vy, vx);
    sprite = scene.add.image(x, y, 'bugIcon').setDisplaySize(40, 40);
  } else {
    const texture =
      evt.name === 'SCANDAL' ? ensureScandalTexture(scene) :
      evt.name === 'LEAK' ? ensureLeakTexture(scene) :
      evt.icon;
    sprite = scene.add.image(x, y, texture).setDisplaySize(40, 40).setOrigin(0.5, 0.5);
  }

  sprite.setDepth(7);

  events.push({ ...evt, x, y, vx, vy, mobile, sprite, facing });
}

function draw() {
  graphics.clear();
  
  // Draw HQ bases using HQ base64 sprite
  if (!p1.baseSprite) {
    p1.baseSprite = graphics.scene.add.image(
      p1.base.x + p1.base.w / 2,
      p1.base.y + p1.base.h - 8,
      'hq_base'
    )
      .setDisplaySize(p1.base.w, p1.base.h)
      .setOrigin(0.5, 1)
      .setDepth(3)
      .setTint(p1.color);
  }
  p1.baseSprite.setPosition(p1.base.x + p1.base.w / 2, p1.base.y + p1.base.h - 8).setVisible(true);
  drawRoundWins(p1.base, p1RoundWins, p1.color);
  
  if (!p2.baseSprite) {
    p2.baseSprite = graphics.scene.add.image(
      p2.base.x + p2.base.w / 2,
      p2.base.y + p2.base.h - 8,
      'hq_base'
    )
      .setDisplaySize(p2.base.w, p2.base.h)
      .setOrigin(0.5, 1)
      .setDepth(3)
      .setTint(p2.color);
  }
  p2.baseSprite.setPosition(p2.base.x + p2.base.w / 2, p2.base.y + p2.base.h - 8).setVisible(true);
  drawRoundWins(p2.base, p2RoundWins, p2.color);

  if (p1ScoreText) p1ScoreText.setText(`${Math.round(p1Progress)}%`);
  if (p2ScoreText) p2ScoreText.setText(`${Math.round(p2Progress)}%`);
  
  // Draw resources
  resources.forEach(res => {
    if (res.sprite) {
      res.sprite.setPosition(res.x, res.y);
      res.sprite.setVisible(true);
    } else {
    graphics.fillStyle(res.color, 1);
    graphics.fillCircle(res.x, res.y, 12);
    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.strokeCircle(res.x, res.y, 12);
    }
  });
  
  // Draw coffees
  coffees.forEach(cup => {
    if (cup.sprite) {
      cup.sprite.setPosition(cup.x, cup.y).setVisible(true);
    }
  });
  
  // Draw events
  events.forEach(evt => {
    if (evt.sprite) {
      evt.sprite.setPosition(evt.x, evt.y).setVisible(true);
      if (evt.mobile && typeof evt.facing === 'number') {
        evt.sprite.setRotation(Phaser.Math.Angle.Wrap(evt.facing - Math.PI / 2));
      } else {
        evt.sprite.setRotation(0);
      }
    } else {
      graphics.fillStyle(evt.color, 0.8);
      graphics.fillRect(evt.x - 12, evt.y - 12, 24, 24);
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.strokeRect(evt.x - 12, evt.y - 12, 24, 24);
    }
  });
  
  // Draw players via sprites
  if (p1.sprite) {
    p1.sprite.setPosition(p1.x, p1.y)
      .setDepth(p1Boost > 0 ? 12 : 10)
  }
  if (p2.sprite) {
    p2.sprite.setPosition(p2.x, p2.y)
      .setDepth(p2Boost > 0 ? 12 : 10)
  }
  
  // Progress bars
  // Progress bars
  const barWidth = 20;
  const barHeight = 600;
  const barTop = 0;
  const p1CooldownFraction = getCooldownFraction(p1NextShotTime);
  const p2CooldownFraction = getCooldownFraction(p2NextShotTime);
  const p1CooldownX = barWidth;
  const p2CooldownX = 780 - COOLDOWN_BAR_WIDTH;
  const cooldownBackgroundColor = 0x222222;
  graphics.fillStyle(cooldownBackgroundColor, 1);
  graphics.fillRect(p1CooldownX, barTop, COOLDOWN_BAR_WIDTH, barHeight);
  graphics.fillRect(p2CooldownX, barTop, COOLDOWN_BAR_WIDTH, barHeight);
  graphics.fillStyle(COOLDOWN_BAR_COLOR, 1);
  const p1CooldownFill = p1CooldownFraction * barHeight;
  const p2CooldownFill = p2CooldownFraction * barHeight;
  graphics.fillRect(p1CooldownX, barTop + barHeight - p1CooldownFill, COOLDOWN_BAR_WIDTH, p1CooldownFill);
  graphics.fillRect(p2CooldownX, barTop + barHeight - p2CooldownFill, COOLDOWN_BAR_WIDTH, p2CooldownFill);
  graphics.lineStyle(1, 0x000000, 0.6);
  graphics.strokeRect(p1CooldownX, barTop, COOLDOWN_BAR_WIDTH, barHeight);
  graphics.strokeRect(p2CooldownX, barTop, COOLDOWN_BAR_WIDTH, barHeight);

  graphics.fillStyle(0x333333, 1);
  graphics.fillRect(0, barTop, barWidth, barHeight);
  graphics.fillRect(780, barTop, barWidth, barHeight);

  graphics.fillStyle(p1.color, 1);
  const p1Fill = (p1Progress / 100) * barHeight;
  graphics.fillRect(0, barTop + barHeight - p1Fill, barWidth, p1Fill);

  graphics.fillStyle(p2.color, 1);
  const p2Fill = (p2Progress / 100) * barHeight;
  graphics.fillRect(780, barTop + barHeight - p2Fill, barWidth, p2Fill);
}


function updateStatus(msg) {
  if (!statusText) return;
  statusText.setText(msg);
  statusText.setAlpha(1);
  statusText.setVisible(true);
}

function drawRoundWins(base, wins, color) {
  if (!wins) return;
  const spacing = 22;
  const radius = 7;
  const centerY = base.y + base.h + 24;
  const startX = base.x + base.w / 2 - ((wins - 1) * spacing) / 2;
  graphics.lineStyle(2, 0x000000, 0.6);
  for (let i = 0; i < wins; i++) {
    const cx = startX + i * spacing;
    graphics.fillStyle(color, 0.9);
    graphics.fillCircle(cx, centerY, radius);
    graphics.strokeCircle(cx, centerY, radius);
  }
}

function createStartScreen(scene) {
  startScreenActive = true;
  setPlayersVisible(false);
  startScreenElements.forEach(el => { if (el && el.destroy) el.destroy(); });
  startScreenTweens.forEach(t => { if (t && t.stop) t.stop(); });
  startScreenElements = [];
  startScreenTweens = [];

  const overlay = scene.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x070a16, 0.92).setDepth(50);
  startScreenElements.push(overlay);

  const title = addText(scene, SCREEN_WIDTH / 2, 90, 'RACE TO AGI', {
    fontSize: '60px',
    color: '#ffea00',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0.5).setDepth(51);
  startScreenElements.push(title);
  startScreenTweens.push(scene.tweens.add({
    targets: title,
    y: title.y - 18,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  }))
  const startPrompt = addText(scene, SCREEN_WIDTH / 2, 140, 'Presiona START para empezar', {
    fontSize: '20px',
    color: '#ffee55',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0.5).setDepth(51);
  startScreenElements.push(startPrompt);

  const previewY = 280;
  const player1Preview = scene.add.image(160, previewY + 55, 'char_south')
    .setDisplaySize(CHARACTER_SIZE * 2, CHARACTER_SIZE * 2)
    .setOrigin(0.5, 1)
    .setDepth(51)
    .setTint(p1.color || 0x0099ff);
  startScreenElements.push(player1Preview);

  const player2Preview = scene.add.image(640, previewY + 55, 'char_south')
  .setDisplaySize(CHARACTER_SIZE * 2, CHARACTER_SIZE * 2)
  .setOrigin(0.5, 1)
  .setDepth(51)
  .setTint(p2.color || 0x0099ff);
  startScreenElements.push(player2Preview);


  const controlsText = addText(scene, 240, previewY - 90,
    'Movimiento: ↑ → ↓ ←\nA: Disparar demandas al rival.',
    {
      fontSize: '18px',
      color: '#ffffff',
      align: 'left',
      lineSpacing: 8
    }).setOrigin(0, 0).setDepth(51);
  startScreenElements.push(controlsText);

  const collectTitle = addText(scene, SCREEN_WIDTH / 2, 300, 'Recolecta estos objetos', {
    fontSize: '22px',
    color: '#66ffcc',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0).setDepth(51);
  startScreenElements.push(collectTitle);

  const dataTexture = ensureDataTexture(scene);
  const collectItems = [
    { key: dataTexture, label: 'Datos' },
    { key: 'computeIcon', label: 'GPU' },
    { key: 'fundingIcon', label: '$$$' },
    { key: 'coffeeIcon', label: 'Café' }
  ];
  const collectSpacing = 100;
  const collectStartX = SCREEN_WIDTH / 2 - ((collectItems.length - 1) * collectSpacing) / 2;
  collectItems.forEach((item, idx) => {
    const icon = scene.add.image(collectStartX + idx * collectSpacing, 360, item.key)
      .setDisplaySize(item.key === dataTexture ? 52 : 64, item.key === dataTexture ? 52 : 64)
      .setDepth(51);
    const label = addText(scene, icon.x, 390, item.label, {
      fontSize: '14px',
      color: '#dddddd'
    }).setOrigin(0.5, 0).setDepth(51);
    startScreenElements.push(icon, label);
  });

  const avoidTitle = addText(scene, SCREEN_WIDTH / 2, 440, 'Evita estos objetos', {
    fontSize: '22px',
    color: '#ff8888',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0).setDepth(51);
  startScreenElements.push(avoidTitle);

  const scandalTexture = ensureScandalTexture(scene);
  const leakTexture = ensureLeakTexture(scene);
  const avoidItems = [
    { key: 'bugIcon', label: 'Bug' },
    { key: leakTexture, label: 'Filtración' },
    { key: scandalTexture, label: 'Escándalo' }
  ];
  const avoidSpacing = 120;
  const avoidStartX = SCREEN_WIDTH / 2 - ((avoidItems.length - 1) * avoidSpacing) / 2;
  avoidItems.forEach((item, idx) => {
    const icon = scene.add.image(avoidStartX + idx * avoidSpacing, 490, item.key)
      .setDisplaySize(40, 40)
      .setDepth(51);
    const label = addText(scene, icon.x, 520, item.label, {
      fontSize: '14px',
      color: '#ffcccc'
    }).setOrigin(0.5, 0).setDepth(51);
    startScreenElements.push(icon, label);
  });
}

function beginGameFromStartScreen(scene) {
  if (!startScreenActive) return;
  startScreenActive = false;
  startScreenShown = true;
  startScreenElements.forEach(el => { if (el && el.destroy) el.destroy(); });
  startScreenTweens.forEach(t => { if (t && t.stop) t.stop(); });
  startScreenElements = [];
  startScreenTweens = [];
  setPlayersVisible(true);
  startBackgroundMusic(scene);
  playTone(scene, 440, 0.1);
}

function startBackgroundMusic(scene) {
  const ctx = scene.sound.context;
  if (!ctx) return;
  const patternIndex = Math.min(currentRound - 1, MUSIC_PATTERNS.length - 1);
  const pattern = MUSIC_PATTERNS[patternIndex];
  if (!pattern) return;
  const beat = pattern.beat;
  const maxVoiceLength = Math.max(...pattern.voices.map(v => v.notes.length));
  const percussionLength = pattern.percussion ? ((Math.max(...pattern.percussion.steps) || 0) + 1) : 0;
  const loopDuration = Math.max(maxVoiceLength, percussionLength) * beat;

  const targetGain = 0.4 + patternIndex * 0.15;
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.connect(ctx.destination);
  }
  const now = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  const currentValue = Math.max(musicGain.gain.value || 0.0001, 0.0001);
  musicGain.gain.setValueAtTime(currentValue, now);
  musicGain.gain.linearRampToValueAtTime(targetGain, now + 2);

  const schedulePattern = (startTime) => {
    const baseTime = startTime + 0.05;
    const createTone = (frequency, time, length, amp, type) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, time);
      osc.connect(noteGain);
      noteGain.connect(musicGain);
      noteGain.gain.setValueAtTime(0.0001, time);
      noteGain.gain.linearRampToValueAtTime(amp, time + Math.min(0.04, beat * 0.4));
      noteGain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      osc.onended = () => {
        osc.disconnect();
        noteGain.disconnect();
      };
      osc.start(time);
      osc.stop(time + length + 0.02);
    };

    pattern.voices.forEach(voice => {
      voice.notes.forEach((freq, idx) => {
      if (!freq) return;
      const t = baseTime + idx * beat;
        createTone(freq, t, beat * (voice.sustain || 1), voice.amp || 0.04, voice.type || 'sine');
      });
    });

    if (pattern.percussion) {
      const { steps, freq, amp, decay } = pattern.percussion;
      steps.forEach(step => {
        const t = baseTime + step * beat;
      const noise = ctx.createOscillator();
      const gain = ctx.createGain();
      noise.type = 'square';
        noise.frequency.setValueAtTime(freq || 50, t);
      noise.connect(gain);
      gain.connect(musicGain);
      gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(amp || 0.1, t + 0.01);
        const decayTime = beat * (decay || 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);
        noise.onended = () => {
          noise.disconnect();
          gain.disconnect();
        };
      noise.start(t);
        noise.stop(t + decayTime + 0.05);
    });
    }
  };

  schedulePattern(ctx.currentTime);

  if (musicTimer) {
    musicTimer.remove(false);
  }

  musicTimer = scene.time.addEvent({
    delay: loopDuration * 1000,
    loop: true,
    callback: () => schedulePattern(ctx.currentTime)
  });

  scene.events.once('shutdown', () => {
    if (musicTimer) {
      musicTimer.remove(false);
      musicTimer = null;
    }
  });
}

function stopBackgroundMusic(scene) {
  const ctx = scene.sound.context;
  if (musicTimer) {
    musicTimer.remove(false);
    musicTimer = null;
  }
  if (!musicGain || !ctx) return;
  const now = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  const currentValue = Math.max(musicGain.gain.value || 0.0001, 0.0001);
  musicGain.gain.setValueAtTime(currentValue, now);
  musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
}

function endGame(scene) {
  gameOver = true;
  stopBackgroundMusic(scene);
  clearPlayerInvulnerability(1);
  clearPlayerInvulnerability(2);
  const winner = p1Progress > p2Progress ? 'PLAYER 1' : 
                 p2Progress > p1Progress ? 'PLAYER 2' : 'TIE';
  const winColor = p1Progress > p2Progress ? '#0099ff' : 
                   p2Progress > p1Progress ? '#00ff66' : '#ffff00';
  const winLabel = winner !== 'TIE' ? playerLabel(winner) : null;
  
  if (winner === 'PLAYER 1') p1RoundWins++;
  else if (winner === 'PLAYER 2') p2RoundWins++;
  clearResources();
  clearEvents();
  clearProjectiles();
  clearTrails();
  setPlayersVisible(false);
  
  playTone(scene, winner === 'TIE' ? 440 : 880, 0.3);
  
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.82);
  overlay.fillRect(0, 0, 800, 600);
  
  // draw overlay backgrounds
  const roundMessage = winLabel 
    ? `${winLabel} gana la Ronda ${currentRound}`
    : `La Ronda ${currentRound} termina en empate!`;
  
  if (roundText) {
    roundText.setText(`Ronda ${currentRound} completada`);
  }

  const matchWinnerKey = p1RoundWins >= 2 ? 'PLAYER 1' :
                        p2RoundWins >= 2 ? 'PLAYER 2' : null;
  const finalRound = matchWinnerKey !== null || currentRound >= MAX_ROUNDS;

  if (finalRound) {
    const totalWinnerKey = matchWinnerKey !== null ? matchWinnerKey :
      p1RoundWins > p2RoundWins ? 'PLAYER 1' :
                        p2RoundWins > p1RoundWins ? 'PLAYER 2' : null;
    const totalWinnerLabel = totalWinnerKey ? playerLabel(totalWinnerKey) : null;
    const agiMessage = totalWinnerLabel ? `${totalWinnerLabel} logró la AGI!` : 'No hay AGI hoy - empate!';
    if (roundText) roundText.setText('Partida completada');
    updateStatus(agiMessage);
    addText(scene, 400, 250, agiMessage, {
      fontSize: totalWinnerLabel ? '44px' : '36px',
      color: '#ffff66',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(1000);

    addText(scene, 400, 310, 'Felicidades! El mundo nunca volverá a ser igual', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1000);
    
    const restartTxt = addText(scene, 400, 410, 'Presiona START para reiniciar la partida', {
    fontSize: '24px',
    color: '#ffff00'
    }).setOrigin(0.5).setDepth(1000);
  
  scene.tweens.add({
    targets: restartTxt,
    alpha: { from: 1, to: 0.3 },
    duration: 700,
    yoyo: true,
    repeat: -1
  });
  } else {
    updateStatus(roundMessage);
    addText(scene, 400, 220, roundMessage, {
      fontSize: '40px',
      color: winColor,
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(1000);

    let countdown = 3;
    if (nextRoundText) {
      nextRoundText.destroy();
    }
    nextRoundText = addText(scene, 400, 340, '', {
      fontSize: '24px',
      color: '#ffcc66'
    }).setOrigin(0.5).setDepth(1000);
    const updateCountdown = () => {
      nextRoundText.setText(`La siguiente ronda comienza en ${countdown}`);
    };
    updateCountdown();
    if (pendingRoundTimer) {
      pendingRoundTimer.remove(false);
    }
    pendingRoundTimer = scene.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          updateCountdown();
          return;
        }
        nextRoundText.setText('La siguiente ronda comienza ahora!');
        pendingRoundTimer.remove(false);
        pendingRoundTimer = scene.time.delayedCall(500, () => {
          restartGame(scene, false);
          pendingRoundTimer = null;
        });
      },
      loop: true
    });
  }
}

function restartGame(scene, resetMatch) {
  if (pendingRoundTimer) {
    pendingRoundTimer.remove(false);
    pendingRoundTimer = null;
  }
  if (resetMatch) {
    currentRound = 1;
    p1RoundWins = 0;
    p2RoundWins = 0;
  } else {
    currentRound = Math.min(currentRound + 1, MAX_ROUNDS);
  }
  resources.forEach(res => {
    if (res.sprite) res.sprite.destroy();
  });
  p1Progress = 0;
  p2Progress = 0;
  resources = [];
  events = [];
  coffees = [];
  gameOver = false;
  resourceTimer = 0;
  eventTimer = 0;
  coffeeTimer = 0;
  p1Boost = 0;
  p2Boost = 0;
  clearProjectiles();
  clearTrails();
  p1NextShotTime = 0;
  p2NextShotTime = 0;
  clearPlayerInvulnerability(1);
  clearPlayerInvulnerability(2);
  
  p1.x = 100; p1.y = 120;
  p1.base.x = 50;
  p1.base.y = 70;
  p2.x = SCREEN_WIDTH - 120; p2.y = PLAYFIELD_HEIGHT - 20;
  p2.base.x = SCREEN_WIDTH - 170;
  p2.base.y = PLAYFIELD_HEIGHT - 90;
  p1.inventory = { DATA: 0, COMPUTE: 0, FUNDING: 0 };
  p2.inventory = { DATA: 0, COMPUTE: 0, FUNDING: 0 };
  if (nextRoundText) {
    nextRoundText.destroy();
    nextRoundText = null;
  }
  setPlayerFacing(p1, 'south');
  setPlayerFacing(p2, 'north');
  if (p1.sprite) {
    p1.sprite.setPosition(p1.x, p1.y);
    p1.sprite.setDisplaySize(CHARACTER_SIZE, CHARACTER_SIZE);
  }
  if (p2.sprite) {
    p2.sprite.setPosition(p2.x, p2.y);
    p2.sprite.setDisplaySize(CHARACTER_SIZE, CHARACTER_SIZE);
  }
  if (p1BoostText) {
    p1BoostText.setVisible(false);
    p1BoostText.setText('');
  }
  if (p2BoostText) {
    p2BoostText.setVisible(false);
    p2BoostText.setText('');
  }
  
  setPlayersVisible(true);
  scene.scene.restart();
}

function setPlayerFacing(player, facing) {
  if (!player || !player.sprite) return;
  player.facing = facing;
  const texture = 'char_' + facing;
  if (player.currentTexture !== texture) {
    player.sprite.setTexture(texture);
    player.currentTexture = texture;
  }
}

function updatePlayerSprite(scene, player, dx, dy) {
  if (!player || !player.sprite) return;
  player.sprite.setDisplaySize(CHARACTER_SIZE, CHARACTER_SIZE);

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const moving = absDx > 0.1 || absDy > 0.1;
  if (moving) {
    let facing;
    if (absDx > absDy) {
      facing = dx > 0 ? 'east' : 'west';
    } else {
      facing = dy > 0 ? 'south' : 'north';
    }
    if (facing !== player.facing) {
      setPlayerFacing(player, facing);
    }
  }
  setPlayerFacing(player, player.facing);

  const bobSpeed = moving ? 0.02 : 0.06;
  const targetBob = moving ? Math.sin(player.walkPhase || 0) * 6 : 0;
  player.walkPhase = (player.walkPhase || 0) + (absDx + absDy + 0.01) * bobSpeed * 60;
  if (!moving) {
    player.walkPhase = 0;
  }
  player.sprite.rotation = 0;
  player.sprite.setPosition(player.x, player.y + targetBob);
}

function playerHasResources(player) {
  for (const key in player.inventory) {
    if (player.inventory[key] > 0) return true;
  }
  return false;
}

function playerInBase(player) {
  const base = player.base;
  const margin = HQ_CAPTURE_MARGIN;
  const expanded = {
    left: base.x - margin,
    right: base.x + base.w + margin,
    top: base.y - margin,
    bottom: base.y + base.h + margin
  };
  const bounds = getPlayerBounds(player);
  return !(bounds.right < expanded.left ||
           bounds.left > expanded.right ||
           bounds.bottom < expanded.top ||
           bounds.top > expanded.bottom);
}

function getPlayerBounds(player) {
  if (player.sprite) {
    const halfW = player.sprite.displayWidth / 2;
    const height = player.sprite.displayHeight;
    return {
      left: player.x - halfW,
      right: player.x + halfW,
      top: player.y - height,
      bottom: player.y
    };
  }
  const halfW = PLAYER_HITBOX_WIDTH / 2;
  return {
    left: player.x - halfW,
    right: player.x + halfW,
    top: player.y - PLAYER_HITBOX_HEIGHT,
    bottom: player.y
  };
}

function pointInPlayerBounds(player, x, y) {
  const bounds = getPlayerBounds(player);
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}

function activateCaffeineBoost(playerNum, scene) {
  const duration = CAFFEINE_DURATION;
  if (playerNum === 1) {
    p1Boost = duration;
    updateStatus('Jugador 1 tomo café! Impulso de velocidad!');
  } else {
    p2Boost = duration;
    if (p2BoostText) {
      p2BoostText.setVisible(true);
      p2BoostText.setText('Cafeína: ' + Math.ceil(p2Boost / 1000) + 's');
    }
    updateStatus('Jugador 2 tomo café! Impulso de velocidad!');
  }
  playTone(scene, 1200, 0.12);
}

function clearResources() {
  resources.forEach(res => {
    if (res.sprite) res.sprite.destroy();
  });
  resources.length = 0;
  coffees.forEach(cup => {
    if (cup.sprite) cup.sprite.destroy();
  });
  coffees.length = 0;
}

function clearEvents() {
  events.forEach(evt => {
    if (evt.sprite) evt.sprite.destroy();
  });
  events.length = 0;
}

function clearProjectiles() {
  projectiles.forEach(proj => {
    if (proj.sprite) proj.sprite.destroy();
  });
  projectiles.length = 0;
}

function getCooldownFraction(nextShotTime) {
  if (!PROJECTILE_COOLDOWN) return 1;
  const remaining = Math.max(0, nextShotTime - lastUpdateTime);
  return Phaser.Math.Clamp(1 - remaining / PROJECTILE_COOLDOWN, 0, 1);
}

function drawBackgroundPattern(layer) {
  if (!layer) return;
  layer.clear();
  const cellSize = 60;
  for (let y = 0; y < 600; y += cellSize) {
    for (let x = 0; x < 800; x += cellSize) {
      const baseColor = BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)];
      layer.fillStyle(baseColor, 1);
      layer.fillRect(x, y, cellSize + 2, cellSize + 2);
    }
  }
}

function addTrailClone(scene, player, trailArray) {
  if (!scene || !player || !player.sprite) return;
  const textureKey = player.sprite.texture ? player.sprite.texture.key : (player.currentTexture || 'char_south');
  const clone = scene.add.image(player.sprite.x, player.sprite.y, textureKey)
    .setOrigin(0.5, 1)
    .setDisplaySize(CHARACTER_SIZE, CHARACTER_SIZE)
    .setTint(player.color)
    .setFlipX(player.sprite.flipX)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth((player.sprite.depth || 10) - 0.5);
  trailArray.unshift(clone);
  if (trailArray.length > TRAIL_MAX_CLONES) {
    const removed = trailArray.pop();
    if (removed) removed.destroy();
  }
  refreshTrailAlpha(trailArray);
}

function refreshTrailAlpha(trailArray) {
  trailArray.forEach((sprite, idx) => {
    if (!sprite) return;
    const alpha = Phaser.Math.Clamp(0.9 - (idx * (0.75 / TRAIL_MAX_CLONES)), 0.18, 0.92);
    sprite.setAlpha(alpha);
  });
}

function fadeTrail(trailArray, delta) {
  for (let i = trailArray.length - 1; i >= 0; i--) {
    const sprite = trailArray[i];
    if (!sprite) {
      trailArray.splice(i, 1);
      continue;
    }
    const newAlpha = sprite.alpha - delta * TRAIL_FADE_SPEED;
    if (newAlpha <= 0.03) {
      sprite.destroy();
      trailArray.splice(i, 1);
    } else {
      sprite.setAlpha(newAlpha);
    }
  }
}

function clearTrailArray(trailArray) {
  for (let i = trailArray.length - 1; i >= 0; i--) {
    const sprite = trailArray[i];
    if (sprite) sprite.destroy();
    trailArray.pop();
  }
}

function clearTrails() {
  p1TrailSprites.forEach(s => s && s.destroy());
  p2TrailSprites.forEach(s => s && s.destroy());
  p1TrailSprites = [];
  p2TrailSprites = [];
  p1TrailTimer = 0;
  p2TrailTimer = 0;
}

function playTone(scene, freq, dur) {
  const ctx = scene.sound.context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = freq;
  osc.type = 'square';
  
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

function playDepositAnimation(scene, player, counts) {
  if (!scene || !player || !counts) return;
  const base = player.base;
  const targetX = base.x + base.w / 2;
  const targetY = base.y + base.h / 2;
  const startX = player.x;
  const startY = player.y - CHARACTER_SIZE * 0.4;
  const iconMap = {
    COMPUTE: 'computeIcon',
    FUNDING: 'fundingIcon'
  };
  Object.entries(counts).forEach(([type, amount]) => {
    const texture = type === 'DATA' ? ensureDataTexture(scene) : iconMap[type];
    if (!texture) return;
    for (let i = 0; i < amount; i++) {
      const offsetX = (Math.random() - 0.5) * 80 + (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 60 + (Math.random() - 0.5) * 30;
      const initialScale = type === 'DATA' ? .7 : 1.1;
      const sprite = scene.add.image(startX + offsetX, startY + offsetY, texture)
        .setDepth(30)
        .setScale(initialScale)
        .setAlpha(1);
      
      scene.tweens.add({
        targets: sprite,
        x: targetX,
        y: targetY,
        alpha: { from: 1, to: .25 },
        scale: { from: initialScale, to: 0.4 },
        duration: 450 + i * 40,
        ease: 'Cubic.easeIn',
        onComplete: () => sprite.destroy()
      });
    }
  });
}

function showFloatingLabel(scene, text, x, y, color, direction = -1) {
  if (!scene) return;
  const label = addText(scene, x, y, text, {
    fontSize: '16px',
    color,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(50);
  scene.tweens.add({
    targets: label,
    y: y + direction * 35,
    alpha: { from: 1, to: 0 },
    duration: 1000,
    ease: 'Cubic.easeOut',
    onComplete: () => label.destroy()
  });
}
