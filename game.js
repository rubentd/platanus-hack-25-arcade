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

const gp = `data:image/png;base64,`
const toData = (payload) => gp + payload.replace(/_/g, '/');

const CHARACTER_SPRITE = {
  north: toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAABOUExURQAAACgHDj0VGVIxLe22mGM4M_rJqffQuvvfzNt5Rt5nIpR1ebtxVNBlMHJKTOmUZ_mtdLidpbCPkvv4+KSDhsSxuOrf4ZVkX9eVgAAAABCvZ60AAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNU7CsHoAAADzSURBVFjD7ZVJDoMwDEWxnRZKOhEH2vuftJko7BCfRVUpb5GdnwfZ0DSVSmUTKqDxLCIk8QHzx9AAbJAFqIuQ2ZxSuMFKSN2bkxF0CiTrHn4tQIZ4bmktOO8WtB0xl3imttstuFzCDnHJT73d38M1bWG5hhswxOWW8Gsq4Xc+KIALaMQ8Ak9B43lwGvAWNLAOmhkggw_pfUJHC6xBQ6ouF+BVoWPSmQkWcBaQBwWOXGQgo8gqkY5Z4GiEKuhf9G3B9ohgstnAdJ8Qwc0s16joOR_4rSTB_Gs7IpjffxVwHN+BTxK9TBRc33gFTPNbqVQqm3wAo_8LHdFOgzAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjUtMTEtMDlUMDM6NTA6NTMrMDA6MDCdfvCHAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI1LTExLTA5VDAzOjUwOjUzKzAwOjAw7CNIOwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNS0xMS0wOVQwMzo1MDo1MyswMDowMLs2aeQAAAAASUVORK5CYII='),
  east: toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAABaUExURQAAACgHDj0VGVIxLWM4M_rJqe22mOrf4fvfzPfQuioTObdKFPKPRfv4+BkasNt5RrtxVNBlMLCPkteVgOmUZ6SDhpVkX5R1eXJKTLidpd5nIvmtdIwmEQAAAL4lbbYAAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNU7CsHoAAAEBSURBVFjD7dbNVoQwDAXgJv1hOhplkEJHff_nNC2cce2NG4+9+3ykoaU4NzLyD0LMTASXs9eE4D2DjydPLapgTfRSLdYuIOEo1yWEyFAPHUjeR50BAcC5gB59E0ZggoBvgS82gDn_fISOHsL16TmCQEc4XwUBunDJRElecECEQ0QBFTi9xpaUIKAJBzBj9U249aD1bnlb1xv+PXFcRKYZB2hbSpG94ICWSxVvAERzn+A1nIDgQF1EdsEBR2bg_jsAeK08gM3Qwfu2FzZsZaKcY8XrHc16lPEJtA7Wj08bQIyfhAOo1TDDdr0afk9OwO+mJQQfsmkf6BQtG2lkZORP5Qv6OglePyUq0wAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNS0xMS0wOVQwMzo1MDo1MyswMDowMJ1+8IcAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjUtMTEtMDlUMDM6NTA6NTMrMDA6MDDsI0g7AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI1LTExLTA5VDAzOjUwOjUzKzAwOjAwuzZp5AAAAABJRU5ErkJggg=='),
  south: toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAABdUExURQD_ACgHDj0VGVIxLWM4M+22mHJKTPfQuvrJqbtxVKRHQOmUZ_vfzJR1eerf4SoTOdt5RvmtdNBlMAAAAPv4+BkasBsRibidpaSDht5nIvKPRZVkX7CPksSxuAD_ALE1QZAAAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNtfL4cAAAAFBSURBVFjD7ZXdcoQgDIVNABO6wlabrbja93_N8qMPYJzedDzjwNX5PAEm6bpbt_6_YJfWj8YYgLyg8v_GWqwAo8oAaFxvqqzVEMC6HnMJvTNOEwHQuhLethDnCdB8gJcAgI5QC6gER8TtNjUA9JT9XI_i_FNgBPxgZqJHjoB0GjAQhPj0zJ9ICONwGhCmLycvYZZvmcGn04DOL295xQp4L+t5f84wipQEMY5B4++6xLsU+Zts8xutH1Pqp2nySdlRYN1kXRYvYdV1lCAoGw1JQHSHOGdn3FLMm+oUMeYEIpsUjqojSQVI3TQAvAqAn3QAkuoil7jlKiTOM4ZhUQByN2kJVmCaFIDAtE8VYFY9hPUBe0d+e42_Nub6oXa6FjeUMq4AjlUHwDIO8nC6mAD1CaiMdehZXwLCsd66devW3+sX_0EO8BAyGdMAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjUtMTEtMDlUMDM6NTA6NTMrMDA6MDCdfvCHAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI1LTExLTA5VDAzOjUwOjUzKzAwOjAw7CNIOwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNS0xMS0wOVQwMzo1MDo1NCswMDowMH6RV2oAAAAASUVORK5CYII='),
  west: toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAABXUExURQAAACgHDj0VGWM4M1IxLe22mHJKTJVkX+rf4bCPkridpcSxuLtxVPvfzPfQuumUZ_v4+CoTOdeVgPrJqYwmEfmtdKuTxtt5RtBlMN5nIpR1eaSDhgAAAEgX11gAAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+kLCQMyNtfL4cAAAAEBSURBVFjD7dbRbsMgDAVQ7ACBtDRuWRdW_v8_Zyp10159pb2U++4jHMUY52Zm3iCkAcp58Ro7QT7EcQQrQf55gGcsAo3C9QUYBPZKBB+WYBRG878xAYkwIG8nQgDnAp3pp94ElMtOECDXcqNXDECVqwRK6QMDRO7WkarlU0I4ym4eyV1KrfUCzPRd64+G3Alr+2rtvLIZcHSIyPaIZoCT1ku0A1lSz72be2CtF8ndfi2OehE7wFqsQASA00NbsAMkWYHN_h_oKMFAFGFgvTHHviGAozFPwCw4VmCHNnQLFVrx4zNAAC3IC2EAZNzufwQEiBEDKCxYC8TgQ21mZubf8g0eiArBSRiIZgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNS0xMS0wOVQwMzo1MDo1NCswMDowMFjZzgkAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjUtMTEtMDlUMDM6NTA6NTQrMDA6MDAphHa1AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI1LTExLTA5VDAzOjUwOjU0KzAwOjAwfpFXagAAAABJRU5ErkJggg=='),
}

const BUG_ICON = toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAHD0lEQVR4AeyaT2jcRRTHZ5tqsomU0krRaqAtYgW12EaspF7ECFKNgiAFqQfRa0G8CepBBC_iRY+KB3sRih5qi2BLqdhgCxapijQejAQbkDYNpbqJcVnzmc1LHrPz+ze_+bULWfG7M_PemzfvfefvbrrOrPH_egSs8QVgeiugtwLWOAM3ZAs0R3e34Pmpu3baknoSxKZ54ECmbZKPIvLKCSChxl9z5vHbt7W+_vNiLSs4bLBt_HDO0DfLvqy+cgK+fHinGZ9rmVOXp2p5g8WWPnfO_ZO3S7BdpQQwg7NTl4OD29rqsysn2EGOjpUSwPh33DdM0bWolAD286tfTZgTT+ztmEkOxuv3bG8B98DjDNjWaJqJQVNo64SwXCkBBPTp39M1TQLJ2YSH7zX1kUcssIMItgz60eWtz1mArkpEJ4Ak3ICn6n1m7ORZK2Y11A5_ZoAVLH9Axgu1dubMPH2WVSuFz_eKMrASlQBm79hjD3WEIjN5dGPyRXB84ozZUlu9+qWPdoZvxtCysvWoBBzft2tlpnVgzBwzzywjbx18yQDuekDyyAXsf1+iT3_3o3mgnkyi9E8rXV1UAlzn0l5YWGhXpycNCQOSPrWwaEBbacwHjfWG_c_1J7Kqy6gE7D9zwbDMmXE3cM6Ascmr9lE0vvQwIlkX9GH_A+oarIiRqwvm58bqNtH60HpUAti3JMdhRsAExXV3cmbSJIFtw_bQgET6ig8IZVtADGOgi4XCBBBM2uAEeHi+z5pwtdVOn7V19rwPJ86fN2wHDTp8csu83Q4vDw232ELcCvhGl4Ss2Hz9ChHAAATjc6RlBNrf328Gf71oxSRuK56P_aP7OqScC1uG6uaNrTXz_Kb2ksdnh6EjIDZZNY4qsbkuUeNRMIBH7BVxZZE4EAPufiDttBIS0vSxdIUIYFD2ahbLvPTcRN02vrLQd_+D1uTgQLPjKW0V6oOYiE2JclULEcCyfvtoe08neW8892yLZN2Z1_bodTupzvkwtmePeXFkt8lDQlZsvnEKEYCDN5_cReEFM99_5Ih95HgNloWanGWRtyB5FM1ffqKwh+Kh4e3tQ8FKyn8UJoC7nquryNA6YV3HB6c_pQ+sAOSfz_9HkQq5JlONPMpCBPD1Fh+3DtTtnuRWoJ0HJA607b_zDd301iGB7whsg2ubO5_B7H0gr8c8t4UeqBAB0pFXHQcOJz2DC9Af27GDIhWSOMmlGiolthuutFe_jEdJHOBSrams81cLEwDDchhy6PB2d4cjQaDltAUkk7b0dT9d5yWo24xNDCDPQ0n3lXphAujIViAYATINEtRtEpe2qxN5SCnjUzIxIT6CCGAgBtRApiGJ6uS1vmxdj0091F8wAUkD8g1PdLLMIUMgOkptS7sKZPmMSgCHozsgibsy3S5KQld+HeY0JikOJco8SWkbXae_D2IjvwjJmD7bIrJSK4AggAz4zvhe+1qjLQFTd4GOhwuEvV5vP3KQuXbS9ukggrGB2IWUwQQwMC9CEtED8xVW2gQOvr+y3ghoo+dr7qOb28lrEtC7wN4FW4Gx+fGEWFx93nYQAQxI8u9+c8G49++hmXZSOgCuKQFySZi6wCcTna_k5J_ZOGjeu9QyH909ZF+mPrssWRAB4pSkCETaf3x72nz8zKg0vWVaomk6cXZ9dpVgeY+ILqQMIoCXoDsYRLyyOGDF7E9bWfogKY0lUer_nAtJBvjlzc9YSTZF5UEE8MsQyz9rMBLPstF69j6rSsvcuk___m_XXLPc7SACWAEE4s4E8tcmzq0MTkIrjYwKtlmz73NBDJxDPl0eWRABSY7Zk5zOWk9iuq3r3AzoAfKJpb8GUyYB3yTs6iEeuPI87SACSDTLOftVbEhQkqX8YrZmQFbC0l_7Eplb5onJ7UM7iAA6poGZcvWSLCVLFrg2aW2fzzT7vLpgAnxLkfeB7GMCzjNzaYHSH+ALO3zzhxLqGqGzj49gAuisQfL8MsMMIxeCSIB2UfDK484nefGFb65BxirqL8k+GgEyACRI_cPp32skAAlA5FkltrdtWt_xymQFZPUtqo9OgPuVmNljJgmMxCjTIDYQR980W5+uqCw6AXoFSDD8OyESok2CgLqAtgAZtr7k+bYJsImF6ATwD6J8wZEQiQkkYUrsRU6JLTIfkvz7bPPIohFA0Cz_tzYs2t8EfAcVNgIS1RA5pRs4vtj_ZX79dX1KOxoBOOQ1xhciTmtO8bQ_nJCoBv19IHmR41fqscqoBMh9zGxxXUm7TLCQhD_xQVvqMcqoBBAQq4CZArRjAF8ghi_XR3QCmHVmCSLcwcq08QnK+PD1jU6ADAIRaWeA2GWV+KgicRm3MgIYABIoyyCGj7TxKyUgbeBu0fUI6JaZuFlx9FbAzWK+W8btrYBumYnQOMr2+x8AAP__SjqybAAAAAZJREFUAwDAOpWu1IsVngAAAABJRU5ErkJggg==')
const SCANDAL_ICON = toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFdUlEQVR4AeyaT48UVRTFi1noxrAixkCH6CQGcaGu3CioMMgCP4EsDIkrk_kE6krdaOJK3I4uNK6NxKCI_+KMO4GFhJgUiRmJElbExIUJTf86nOH0m1fd9eomMwXTJId777n31Xt17quq7ulaqHb4v7kAO3wDVPMdMN8BO1yB+SWwwzdA7CZ4_Z+_h31Cl2YWXwLnzp4dvv3Wm8PBYO+wy4R9G1MkwIcfvD_87IvPq5VPVqr19Wu9Ope6vtppPUUCPLJ3X3Xlyh_V_v2Pjie7dOFixcT9QD1eU+l_rQX4dW1tePny7xPHv37jxkiAuheYWFhB0FqAM2e+qr47_3114MDjG4dHkL7g23PfbKyrxGktAAf1kycGiNIHcGmynlK0FuCdd9_bdWzp5U3HP3rkpaoPWF1d3bVpcRkipVoLoIGDfQO594UtEuDVkycnVF5eXq5OnHhl2xHpRJEATHTw4JPjG+GpU68RZp8AJOr67tNB8X_Hnq_Ov_jcVFDDWI3BF5o4+K4oFiCd6OE9e6rFxcUJUOMcMXXYN24tVNNADWNl8YUmDr4rigXgMvD7wFPPPL1pF7CYtGt8ZoBvA8ZSh3U0cfBdUSwAE3EZYIWlpaONO4AaOsgOWPt_9tcHaqjXOHyhiYPvik4CpLugzeQP7d7dpmzLazoJ4Kus73wJ+ffmzYlLgZraboT4cG1ArYMxTTG5CDoL8MKhw+N5FxcfG1vuBdqqWEiswCUA1wYaI8sY+ViP8SPoLMDS8ePjzwT1aAcILARB0t1AfF_dBDlRgRN2wGs30HUAJ4s_C2mXiQHjsA64CDrvAE3q3XefvG58dB_AtUE9unewa7Cz0OZ402rCAqj7TJLzfTc8++XX1W8PNj8KyVFDhxEPOwvMG0FYgNruAe6zKMX4nBBi4E8DO6Vu2AGMI+eAiyAsgLqeWhaV4_igQy4Hcuo4gsmXZYx8WbgIwgLUyQ5gMSnnMflpQDTy2Db3AWqob8IsPiwAC3UwocepT34WGEMNlwwfswV1HctTBVAXQViAtLse47M4rEA8DapzSz0xVuASAYgkrosNC0C3BBYgXzbliKdB49xS77H75PjDDLYLwgLQGcDkWCGNxfOY43FH3gFHDk61qc3l4CIIC6BusAj52DSGA9O2rHLU5ZA7JlwEYQHSLuViFug8jzs4B5zXtPX9GF38sAC5TqUcC3OOOAevaevnjlPChQXIdYoFpLxzr_95rfp44dYEjvzwy+jvCVc34PXpsTymLoKwALlOsaCUdw4fERzT6tOcxxwrgrAA3g33WZTH7jflcvwsjjzgvQVsKcICeDfcZyEeu9+Uy_GzOPKAL1HYUoQF8M7iswCsI8c9MBhUDq9P_dx41ZADH50+jSlGWADvLD4rwDpS7onDh6AmAOdj3KfQY_fJCV0ug7AA3gn5WBaFdcDRdWwO5Lw+9RmT4+DBjz__hClCWAB1g1nlY9NYHPw0UNcExqU5OEfpLggLkOuIcyzOY57_cDmQUy15+bJNHLxQugvCAuQ64hwL85hnPycK74Ajp1py8mWbOHiw_tc6pghhAdQdt6zAY_nwly5crPjUxwk7OHnVYanFzgJ1Aq_J8LpOyWUQFkDdccuCPJYPzzc+Yk7YQQ5eSGPxqaXOkXuPyfOpHxYgPeB2xX7i3Afa7oKwAGxRThoL3G8TpzXp+DRPDFSHBWx_t_htEBaALclEWOB+mzitSceneWKgOqygXVByMwwJQCf6Ap28xNCPt4qbbFCAuy9C1aNfc7YLvMWqS4D3BVdWPh3_ct100s6HBOjLa7KcUOmJMwaEBODt0b6Ak+mCkABdJuzbmLkAfevIVq9nvgO2WvG+zXfP74CooLcBAAD__24cXBEAAAAGSURBVAMAVkdb+bD_bnIAAAAASUVORK5CYII=')
const LEAK_ICON = toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADA0lEQVR4AeyUv4rUUBTGR59BbRQEX8NGOzsrO19FG5_B0s5CrLSz08ZyQbBwK2FBQdx9gi12l9_At4QwN7mT8+fesDPwzUluknPP9zsnub254b8DgBs+AJumE_Do1fvLF0fnly2b0BRAS+Pa+wBAJLIj4__w8ZPttk+__Gn2GjSdgDt3720BtPxrAmDYfcwDotUUNAEg08TWSgcw7r4AtJqCdAAYxiyxB6UCKHVfIACT_S1IBYBRTBJ7URqAue4LCIAypyANAAYxR2yp8d4pAGq7r+IAlTUFKQAwhilibwoHsG_3BQhgGVMQDgBDmCH2qFAAS7svUICLnoJQABjBBLFXhQGwdl_AABg5BSEAZJ7iZcQSyRMFIQQAZima2LvcAaj73sYBGjEF7gAwTrHENcgVQFT3BRKw3lPgCoBCKZK4FrkBiO6+gALYcwrcAFAgxRHXJBcAWd0XWEDXToGeKUUXACSnKOLaZAaQ3X0BBrjHFJgBUBDFENcoE4BW3RdowFunwASAQiiCuFaZAazVuOo+ABCJfWPN+__8fjxfXkHLd8BUIZvvC663+00AejOzpJ5wABmvwRLjeiYcgDbqNaYAYAqk3kCEAcBwb2Z31WMCcPTp466ck2veYM5O_0_uN3dxMYDfb17emkr++e9F8bIXBOX5+uzBdS3FTQsXFgMo5EtblnnrhmYAJ8e_rDVsn8cQ2p7M_Om+dz_+zdw5f9kEgNfg7PhncZe51wAjkpJwruOaaBl_8psAkAAt+RjyXK2AMhTPeXSfPGYATAGJSmIKUOn6rvWx2V33sGbtPjnMAEiCoqYAGOQfyqv75HQBoCmYgsAUIDa1SOY9uk8dLgBIVAOB+yzyNk8tbgBIFgkhwjw1uwIg4RDC1CvBvTXCOGLkUc0z+9zjDoDNgYA4BgLiGNV+BzCNeCbCOHlRCAASIyAgjoEgvX77YSNzXEOcD8UaxhHHUQoFoKKBMBTrJ9+_bQQC46xhdijWopUCYGxiCCPb8LiWJgDGRbQ8Xz0AK7wrAAAA__+EvNZVAAAABklEQVQDACgcEZBlDgb_AAAAAElFTkSuQmCC')
const COFFEE_ICON = toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADlklEQVR4AeyXz0tUURTHzwRtpEQzyxIMNSFXli0isUU_Ny2jP6B_w1WbgnZCmza5kWgRCRJBYOZCG6PIXwgaqemQOmkW_WAgCorPkxOvx+S8N855DjNX+My79865953v9577nrNLyvzPGVDmBSCuAlwFlLkD7giUeQG4h6A7Au4IlLkD7giUeQG4t0DZHYFgxcdmwJ1bt39HIZioVd_cABXtFzCcTEouss3zr1GotqkBiPAnml5NC7Q0Nomf+oN1Xph_bGF+wRsLruENFvDD1ADNE9Ggfa6ZTEYU+vD23aZo2nFhagBljpC6Q5s7TFupqKgQ0D5VAJjCWMfpTqk7cJimKWYGaOluZcL_lB1va_e+So6OCEdB1_IGC_xhYkAwYUwAKiFIU3OTKBcvXRaYmBwToEIAzcE1GSsEJgYgNltyjPvhuQDsMvHz8zMCtIMQFxwrRN_EABJDKGea9nagYqzEk5eZASy+_CEtmMDrjX42eOhpmev3iAb6luJZ38SAe_33EywOmMDrDSP8nOnoEERy_rnyxIfzF85Jc3Or9_8C8zGI6_XuG3_XpF8oTAwgOUzoXE3S9MAIP5x7P+m1FYHBp8_k+ciQNwfxjRN9YiWem5gZwOKACUA7Ci3Tj6VtYUjOnjoaZVrkWHMDNCNM8MPOKgjdO3BXFMSfbK0R0PlWV1MDBn7u3jLvyspqAYQG0YmjiSptmlxNDajaVymYAFGzRzjU1u6POvWf+FwdUwO4OSYAJiiMZwPBCsIhW1whx8wN0GQxQVEjHm58F+gaWRKEI_j9+mfhqvOsr7EZ4BeiRpw41iBKnKL9ueyIAf4EdrptakDP4FhipwXmur+pAbluHub7nr7BMGF5xxS9AX3jc6ZVVPQG5L21IScWtQHr6x9Dysg_zNyA6dk5gagpcvYfDU9GnRY53tyAl8tfE9fqqz0TchnBjo_PpgTxDZlfYn3+ccvcAG4CmACYoCBWQTQ7frPziMDVdtufweQEsRjALz5uBpigXKnZI4BghZg4icWA3qlUJE2vZzbkwdhcpDn5BsdiwJO1T4n+xW8CWyXa92JFYOnLD+l+s2j6_tc8YjGAm2ECYILSO5WS3qmUJxrhxHW9mkkA7XyIOic2AzQxTAiCYEXj4rrGbkBcwsLexxkQ1qlSjXMVUKo7G1aXq4CwTpVqnKuAUt3ZsLpcBYR1qlTjXAWU6s6G1eUqIKxTxRq33bz+AAAA__8Ptn4QAAAABklEQVQDAH6+u5AFfIvsAAAAAElFTkSuQmCC')
const FUNDING_ICON = toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAEgklEQVR4AezYv6sdRRjG8Y12QaLcStQiEARTWFoIgo0ELAOCnY11LKy1srdQ2_wDNgEbQStBsLAKSUhICEmRhFSXJMWFQMJNPgtvGIad3Z3dc+49YTfwvfPOO+_8eJ6Zc26SN5qF_1kNWPgDaNYXsL6AhTuwfgQW_gDWL8H1I7B+BBbuwPoR2MUH8POlHw9TtnnGnXoBIZrgTz8_3UCc5vU3yU4YkAokGiFSDP20Tn8K+ZxjNSAVRCTyA0Y_HTMv8nPbYzHgzh9fHcLhCYN4CHVQxwSI53CkBhCN98983OD8m9ebd__9s_nvn7udlIQxAcbnmnAkBhANouHgEIMRkEsJY9JcGjMBP1y80P7WSMfGxls1wO1c_v3rQyJROlSMdZlQmpPm9_beabv2a4OKH1sxwEHgHAdfnGvu377yCrkumAAmoKsmz6Uv5O69B83VazfyksH+Rg0gGnb1NCF++NmXzaXnZ4WtEW1Q+MEEQ0xArCEXpML39x81xBt76+1Tmio2YgDRsLMDQ4z0sExAvAjjXTABxuJLUpyuRTSeHBwYmswsA4iG3YmGOHDgiNOWCfqM0JZgAryEWItolObU5icZQDRsRjTENTABJRPkg6ePHrfPvE_46Q_ea365cPFEzRnUVhsQwk2eIty8lDCBWHktxE9fCoe4BOEw_t2v3x5qa6g2wC3AJp4lxF0MGWQc8SX5281n7TJEo+0UfhANw84DcS3VBsQGNvQNrM8EiHMILKHWPIitWSPc_uaYO5XJBtjQN7ADOIh+CBEPoRbqrAFxH_mN27+vfszYLANiAwchgBFEIcby1hjk1Zsn7uP_vXPN2Q_PNGPr+9bKx6oN8E176uTJfJ2232cE0VBINNTrD_HJ_l_N9Vu3m6F6Z8vXGupXG+Cb1t+9PUd0beCgBLoxoqFOX168KZwhcLbadasNsAERENt86EWoI54x4i6sg66xrpxaGHMWiGuZZEBsYlPC4kVEvqstiScC5lhP24daqLH3mDlqS8wywKKExSEcDPJDqIM68yHuI6+3d1_9mLFqA+IQ+eIEQF4NxDnykB97gzv1W+D78z+dIKD0uWcCCFSnDaJvHGNvcMxvAb8BEHuNbatfQHzTDn3uCXTDIVqrLz_2cGPqiMaY2q6aagMsQgTEhJVegxuOOq2+OV1YB55713ieIxp5vrY_yYDYhCi3OvQaor6rJRrGrOe5i0sQjdJ4bX6WATZzqw7OCEIgP4Q6qDMf4hJEozQ+NT_bgNg4jNAnDOIcecgzbUi4uo+++bv6PzrMG0O1AW4BpcUJgvEQKkb0jYNp8iUIR2l8E_lqA2JTJiD6eUugGw7RWn35vDbvE408v43+ZAPiMH0muOEQrNWPeXlrHRyV8Nh_tgEWcnCIazEPtfM2Vb8RA+IwhCD6fa069NVMGauds1EDYnPCEP20lUeaO854KwaEoFSoGDG2K+1WDSCSaP+AEu8iWzdgF0WnZ1oNSN1YYry+gCXeeqp5fQGpG0uM1xewxFtPNa8vIHVjifH6Al73W597_hcAAAD__2Xv1_EAAAAGSURBVAMAFjHsn3TC3r8AAAAASUVORK5CYII=')
const COMPUTE_ICON = toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAH9UlEQVR4AezYza+eQxgG8KnFKTb8AYSgGiQkCM5CGhaISCSiSKo0WKASSioRia2E+Ep8bJBGdUFFaCiJkJTKsUCoIPT1pg1bohvVszme35NzP5mO5_067fl429P0OjNzzz0z93XdM_PMOSek4_zfsgDH+QZIyztgeQccAwqctPLkmbnSGOsjgPiKFStmTjv9tLnyH887AHE46+yz0vnnXZAmJiaS9lxUOGEugxZrDJIyjjjkcWjrz23D1MdCAMSCuIz3Ivbv9MFeXT3tS1oAxEF2+xEPdidOnBTVocslKQDSgDhMTk6mSy6+uEEvdnyN69XfZl9SAggeEFl3+7qEOExNTaVvvv22ATHY2wiNalsSAiANiK9de3Od6ddefzXt2rWrxk8__5hyEIMohICctDnMldv61RdVAIGCoEFWkdu6bWsdc+e3vfUnru38E4Qf_1KEevCQPxZFAKTjVkdcrMhve3NbnWntAKJRbyv1E8H4tv7SVrYXVADEAWlZffDBh+p4BG9Lh11f3ZH9CJsyz7j29PR0mj50qPE2j3UaQ5_KggggGBDYezt2pGefez4F+YhNJgNsiCnbMPXVV4eZHRXHgZCHdQzRmFcBkIac+MObHkogthdeeL6+6WVfO0AIWW0TgR1hvm397GBNa6v3w7wIYGEQBGzYsKEmHcS1Dxz4u4kL4aYxW0GSPSd5ztmrEjsXdWLw0QZC5rtgmJfhURUAaUAaBAWnnHJqveVte9DesmVLnX2fOj4IBYK0EqHAmjVrEh_+fgEKMbT55mKwDfMyPCoCIA1Ig4BdVEqw1UsIMIAUMhA2hIzVXnvLrQnUiaCvJKuvhFjEVdrz9hEJYPL4nLW93GxJQATyhfN6Tlw9JxfEH9h4fyNCjJVhYkDYRi3nJADiQOH169YPfLkRAYgAg4JEKBdh+9tvpRdfejl9+ukn9VB9do0_hLgHgE1n_jnUFqNY1dswkgAmioybGBmPEJ8gk8ues4mAdg4Bxnl3PPK+qBsHfBFk37b1jbR69eq05_vv0l9__sVUw1o5GI2ZWLlSdWgMJQDigLQAzY48QoLVDpTtsCsF7I0vSOPrXXHFFSm2Mp8Yz1c_2w979iSQXTZE2Uu4H_SXdnGLv7Rr9xXAoDzjBkAEL0jBAHuOEOr6665PZ55xRtPFlwiNIasEeSZ+Srsrdpk6W+yyWCNKfaOipwDIU66cHHmLRLBEEFAErK_Er3v3Nia+GkRwFJDzG2DMp89c_EqbPjZnHrT5sinbss+n+1tX0YqeAvR7RJQLCaBT_ebmQixX2bd_f_N4KcV0FMIfgagrQ2h1ZAmiDtaCWNdY219fDv3divzBQ_+sgLwv6j0FCIe20sSlHTlbVBl9AgtfdkSizYeQsQtKAu4XPtCpxDVWvYR5J6t7xFzRZw2YmZnpSTx8DxPAtg9wMIkyICsRmIVz8EWYTwApPjEekaizG5Pvgrvvuqf+M3fuF_5s5jcubOrWcozYzNetMo44sA1CIwDiHjMBwfQabGGLBfixIazu8QLqAtTHVxu0lTkig_wR7VRZz_vV2WIel6vdIyFsgHS51Y3rh0YATj4zLifQFqiJ1XOUtrwdxH2_o26suQK2cz5GPxABCCkBEGPy0l3jbtm+_Z30x+9_JMTBHKOiEcCl5wybyHdZILIxzISCywl5ua1bf0dSGq8vh0yy57BWwNoBWQ670hhxmk+2gW2uaARAHExk0m51luwI7UDZRhwEY9vyQ_qyyy5P+_ft06zBB+rG7A_+MoxoEJvtqn9LRFzb+eYD_mQmLnGC_iNFI0CviQSKoH7BKIE938qd6swKkki7v_g8Ab84o3yNCfDXX8IckK9l_W6VEImBcsyRtAcKUE7uk8Pmu9ypSKtDZNj2FLwy7hL9fHOwESvPPuLsAcRBto828VijpwDuBERcSOEcpSwKLNpRynLU+agTavPmR1UPg4vM_ERAHMLB3PD4bVfWvyeEfT7KngJQvVttO4vKroDUBV2KgqxMdmZ3RC6EcR9+8GH9fTePOZTx_TcfG3Sr9fgj_tx9V6dn3v06zVfmrQc9BdDZD0hHvyw769HuzAoRbaQCxhGrLePfv785IY_4Y69NzTt58Q0UIA_UAGCzC2QSkDt31SpdDYiirzFUFW3jjK+aqZtl_JePnmBqsj7fma8Xq370FUAQyPkkyZx6Nab+j4RMgr6dH++s7fGDL2gj7sybx05hh0duujQhfsedV6WdO3ani258mvuCoq8AIvEoUsqoMgcRwJcBQUC2BOLOupdbpzoetnkQ3_3lLzXx2PJEz9eY7_pAASKA_GILW5TIBZAN2B18fBJlfMM1F_4v4xuf2lGf9YUmLi4YWgBnV2YRMbAXQgildwD_e2+4vCa+aeO1abEzXsY9UIB4D5QD+7WRBlvdEUI8zvhiZ7yMe6AA5YB+u6Bb3ergDYG4y+3JuycX9YyX8ZftkQSIM11OIttQnmO3+kJfbmVsg9oDBZBN5MqJ2CAyzo9PiKAMsC9VDBRA4LazEtzwSk9VUB9nDCVATjDe8Jte+SzF9s77x60+tAAePDk5W94Wz23jWB9KgCDqGYtkfiS0xxlDCYCgy65TPWPtBH859ldk9nHH0ALYBba9m98fMcadeMQ_tAAxQOltrzwWMLIAzr+dcCyQx2FkARwFA6NUH2eMLMA4k22LfVmANlWOJ9vyDjiest3Gdex3QBupUWz_AQAA___zmJrWAAAABklEQVQDAEL0KczjJjGkAAAAAElFTkSuQmCC')
const DATA_ICON = toData('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADMUlEQVR4AeyYzWoVQRCFW6PZuxAXrgRFQUQR30AUn8TFXfk0LvIkovgGIoIEFMSF4EJcuI+GmG_IgUoxP7enq28YpsWT7qqeqjp1pqfbeDmt_E8TYOUbILUd0HbAyhVon8DKN0A7BNsn0D6BlSvQPoGVb4B2C6zuE_A7fmcCXL_24CQHnmgtu5oAvtncBkrjt60XLoCIewKbVwcpBz5+KK9_LtcOFeDmjccnELh7_0kCG9M0_hzY2Nv3HiVAPEIwRiFMAIjduvOwa_zps5cJRJF8_mKTAKICakXlDhMAQl8PPzBURXSNUAHU+ds3r9P7dwcyi0dygePjf8W5fIJwAfSGIIsQgi88ZSuOkWfJ9+3LJ6ahCBcAdhAFzAUamQJvWc8obm_vSkJUn0_rpWO4ABxSIgVpQb6xkbesdcXRvHy6CWRHjGEC_P7z+RKEaAKiAj6ghrYdiQHKw4gNVIt5KcIEGCICcXaFRZ_PrmvOc0N5o_xhAozdzewKC8jLZt4H1vv8+MZqsZ6DMAFyitpnaRTgYxSwd4FwAfjG5xCn8am4ubnH8oYLQDGIAuY54Mrre55coG9tyje1HiaATmZ7cEFa8M1he0AWH6PiGLGBcqsWvlKECQCR_f2rDN1vbpDlNO8cpz+4z2lGwB4Cz5yGdH_JI3SO4B9hAnAyHx39PUeP71rk547nEp4Z1DqbFg9hAhQzuaAETYBo4e33u4TcYTvAnsyIACIE4FYgF1A+W0u+uWOYACKgww4b0gJ2DhTHTUEcee2tgi8CYQL4kxnCQCTV0Laj4sgBsLlVGH0tfHMRJsAQAcjz5jzwA++3NutDeaP81QWwRHmDgvzYzBk98NfGTgRQY0PNsD60VtsfJgAnM_8U5huvRZrc1KBWVI0wASD089fH7r_FIOrBeg58PDbNq0ZOrrFnQwWgEG8HMIcwYE4DFvgsfnw_TGPr5IxunvrhApAUiDCkmeOzsM0y979IEWNhY8fmuWvVBPBEbDPbzH18LXtnAtRqoDRvE6BUwaXHtx2w9DdYyr_tgFIFlx7fdsDS32Ap_7YDShVcenzbAUt_g6X82w4oVfCi40vr_wcAAP__rVPCSQAAAAZJREFUAwAhxVaftdmDmQAAAABJRU5ErkJggg==')

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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

// Resource types
const RESOURCES = {
  DATA: { color: 0x00ffff, icon: 'D', points: 10 },
  COMPUTE: { color: 0xff6b35, icon: 'C', points: 10 },
  FUNDING: { color: 0xffd700, icon: 'F', points: 8 }
};

const RESOURCE_LABELS = {
  DATA: 'Datos',
  COMPUTE: 'Computo',
  FUNDING: 'Financiamiento'
};

const EVENT_LABELS = {
  BUG: 'Bug',
  SCANDAL: 'Escandalo',
  LEAK: 'Filtracion'
};

const PLAYER_LABELS = {
  'PLAYER 1': 'Jugador 1',
  'PLAYER 2': 'Jugador 2',
  TIE: 'Empate'
};

const MAX_ROUNDS = 3;
const PLAYER_HITBOX_WIDTH = 64;
const PLAYER_HITBOX_HEIGHT = 64;
const CAFFEINE_DURATION = 30000;
const COFFEE_SPAWN_INTERVAL = 15000;
const COFFEE_MAX_ON_FIELD = 2;
const COFFEE_COLOR = 0x8b4513;
const COFFEE_FOAM_COLOR = 0xf5f5f5;
const BUG_SPEED = 1;
const HOP_HEIGHT = 14;

const EVENTS = [
  { name: 'BUG', color: 0xff0000, penalty: 10, icon: 'bugIcon' },
  { name: 'SCANDAL', color: 0xff00ff, penalty: 15, icon: 'scandalIcon' },
  { name: 'LEAK', color: 0xff6600, penalty: 12, icon: 'leakIcon' }
];

// Game state
let p1, p2, graphics, resources = [], events = [], coffees = [], gameOver = false;
let p1Progress = 0, p2Progress = 0;
let p1ScoreText, p2ScoreText, statusText, roundText, p1BoostText, p2BoostText;
let resourceTimer = 0, eventTimer = 0, coffeeTimer = 0;
let p1Speed = 1.5, p2Speed = 1.5;
let p1Boost = 0, p2Boost = 0;
let currentRound = 1, p1RoundWins = 0, p2RoundWins = 0;
let pendingRoundTimer = null;
let nextRoundText = null;
let musicGain = null;
let musicTimer = null;

function preload() {
  this.load.image('fundingIcon', FUNDING_ICON);
  this.load.image('computeIcon', COMPUTE_ICON);
  this.load.image('dataIcon', DATA_ICON);
  this.load.image('char_north', CHARACTER_SPRITE.north);
  this.load.image('char_east', CHARACTER_SPRITE.east);
  this.load.image('char_south', CHARACTER_SPRITE.south);
  this.load.image('char_west', CHARACTER_SPRITE.west);
  this.load.image('bugIcon', BUG_ICON);
  this.load.image('scandalIcon', SCANDAL_ICON)
  this.load.image('leakIcon', LEAK_ICON)
  this.load.image('coffeeIcon', COFFEE_ICON);
}

function create() {
  graphics = this.add.graphics();
  
  // Player 1 (Blue startup - top left)
  p1 = {
    x: 100, y: 100,
    color: 0x0099ff,
    inventory: { DATA: 0, COMPUTE: 0, FUNDING: 0 },
    base: { x: 50, y: 50, w: 100, h: 60 },
    sprite: null,
    facing: 'south'
  };
  p1.sprite = this.add.image(p1.x, p1.y, 'char_south').setDepth(10);
  p1.sprite.setDisplaySize(98, 98);
  p1.sprite.setOrigin(0.5, 1);
  p1.sprite.setTint(p1.color);
  p1.runCycle = 0;
  p1.bobOffset = 0;
  p1.currentTexture = 'char_south';
  
  // Player 2 (Green startup - bottom right)
  p2 = {
    x: 700, y: 500,
    color: 0x00ff66,
    inventory: { DATA: 0, COMPUTE: 0, FUNDING: 0 },
    base: { x: 650, y: 490, w: 100, h: 60 },
    sprite: null,
    facing: 'north'
  };
  p2.sprite = this.add.image(p2.x, p2.y, 'char_north').setDepth(10);
  p2.sprite.setOrigin(0.5, 1);
  p2.sprite.setTint(p2.color);
  p2.runCycle = 0;
  p2.bobOffset = 0;
  p2.currentTexture = 'char_north';
  
  // UI
  p1ScoreText = this.add.text(20, 15, '', { 
    fontSize: '20px', color: '#0099ff', fontWeight: 'bold'
  });
  
  p2ScoreText = this.add.text(720, 15, '', { 
    fontSize: '20px', color: '#00ff66', fontWeight: 'bold'
  }).setOrigin(1, 0)
  
  roundText = this.add.text(400, 40, 'Ronda ' + currentRound + ' de ' + MAX_ROUNDS, {
    fontSize: '16px', color: '#bbbbbb'
  }).setOrigin(0.5, 0);
  
  statusText = this.add.text(400, 580, 'Ronda ' + currentRound + ': Logra desarrollar AGI antes que la compañía rival', {
    fontSize: '14px', color: '#888888'
  }).setOrigin(0.5, 1);
  
  p1BoostText = this.add.text(20, 580, '', {
    fontSize: '16px', color: '#ffdd55', fontStyle: 'bold'
  }).setOrigin(0, 1).setVisible(false);
  
  p2BoostText = this.add.text(780, 580, '', {
    fontSize: '16px', color: '#ffdd55', fontStyle: 'bold'
  }).setOrigin(1, 1).setVisible(false);
  
  // Instructions
  this.add.text(400, 10, 'Recoge los recursos y llévalos a tu HQ', {
    fontSize: '20px', color: '#666666'
  }).setOrigin(0.5, 0);
  
  // Input
  this.keys = this.input.keyboard.addKeys({
    w: 'W', s: 'S', a: 'A', d: 'D',
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    one: 'ONE', two: 'TWO', enter: 'ENTER'
  });
  
  this.input.keyboard.on('keydown', (e) => {
    const key = KEYBOARD_TO_ARCADE[e.key] || e.key;
    if (gameOver && (key === 'START1' || key === 'START2')) {
      restartGame(this, true);
    }
  })
  
  // Resources will spawn automatically once the round starts
  resourceTimer = 0;
  
  startBackgroundMusic(this);
  playTone(this, 440, 0.1)
}

function update(time, delta) {
  if (gameOver) return;
  
  // Player movement
  const speed1 = p1Boost > 0 ? p1Speed * 1.5 : p1Speed;
  const speed2 = p2Boost > 0 ? p2Speed * 1.5 : p2Speed;
  
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
  p1.x = Phaser.Math.Clamp(p1.x, 15, 785);
  p1.y = Phaser.Math.Clamp(p1.y, 80, 570);
  p2.x = Phaser.Math.Clamp(p2.x, 15, 785);
  p2.y = Phaser.Math.Clamp(p2.y, 80, 570);
  
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
      updateStatus('Jugador 1 recolectó ' + (RESOURCE_LABELS[res.type] || res.type));
      continue;
    }
    if (pointInPlayerBounds(p2, res.x, res.y)) {
      p2.inventory[res.type]++;
      if (res.sprite) res.sprite.destroy();
      resources.splice(i, 1);
      playTone(this, 880, 0.08);
      updateStatus('Jugador 2 recolectó ' + (RESOURCE_LABELS[res.type] || res.type));
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

    const minX = 40;
    const maxX = 760;
    const minY = 100;
    const maxY = 560;

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
      if (evt.sprite) evt.sprite.destroy();
      p1Progress = Math.max(0, p1Progress - evt.penalty);
      events.splice(i, 1);
      playTone(this, 220, 0.15);
      updateStatus('Jugador 1 choco con ' + (evt.label || evt.name) + '! -' + evt.penalty + '%');
      continue;
    }
    if (pointInPlayerBounds(p2, evt.x, evt.y)) {
      if (evt.sprite) evt.sprite.destroy();
      p2Progress = Math.max(0, p2Progress - evt.penalty);
      events.splice(i, 1);
      playTone(this, 220, 0.15);
      updateStatus('Jugador 2 choco con ' + (evt.label || evt.name) + '! -' + evt.penalty + '%');
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
      activateCaffeineBoost(collectedBy, this);
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
    if (p1BoostText) {
      p1BoostText.setVisible(true);
      p1BoostText.setText('Cafeína: ' + Math.ceil(p1Boost / 1000) + 's');
    }
  } else if (p1BoostText) {
    p1Boost = 0;
    p1BoostText.setVisible(false);
  }
  
  if (p2Boost > 0) {
    p2Boost = Math.max(0, p2Boost - delta);
    if (p2BoostText) {
      p2BoostText.setVisible(true);
      p2BoostText.setText('Cafeína: ' + Math.ceil(p2Boost / 1000) + 's');
    }
  } else if (p2BoostText) {
    p2Boost = 0;
    p2BoostText.setVisible(false);
  }
  
  updatePlayerSprite(this, p1, p1.x - prevP1X, p1.y - prevP1Y);
  updatePlayerSprite(this, p2, p2.x - prevP2X, p2.y - prevP2Y);
  
  draw();
}

function depositResources(player, playerNum, scene) {
  const base = player.base;
  const px = player.x, py = player.y;
  
  // Check if near base
  if (px >= base.x && px <= base.x + base.w && 
      py >= base.y && py <= base.y + base.h) {
    
    let total = 0;
    for (const type in player.inventory) {
      total += player.inventory[type] * RESOURCES[type].points;
      player.inventory[type] = 0;
    }
    
    if (total > 0) {
      if (playerNum === 1) {
        p1Progress = Math.min(100, p1Progress + total);
      } else {
        p2Progress = Math.min(100, p2Progress + total);
      }
      playTone(scene, 1200, 0.12);
      updateStatus('Jugador ' + playerNum + ' deposito +' + total + '%');
      
    }
  }
}

function spawnResource(scene) {
  const types = Object.keys(RESOURCES);
  const type = types[Math.floor(Math.random() * types.length)];
  const x = 100 + Math.random() * 600;
  const y = 100 + Math.random() * 440;
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
      resource.sprite = scene.add.image(x, y, 'dataIcon');
      resource.sprite.setDisplaySize(60, 60);
      resource.sprite.setDepth(5);
    }
  }
  resources.push(resource);
}

function spawnCoffee(scene) {
  const x = 100 + Math.random() * 600;
  const y = 100 + Math.random() * 440;
  const sprite = scene.add.image(x, y, 'coffeeIcon').setDisplaySize(64, 64).setDepth(8);
  coffees.push({
    x,
    y,
    sprite
  });
}

function spawnEvent(scene) {
  let evt;
  const roll = Math.random();
  if (roll < 0.2) {
    evt = EVENTS.find(e => e.name === 'SCANDAL');
  } else if (roll < 0.35) {
    evt = EVENTS.find(e => e.name === 'LEAK');
  } else {
    evt = EVENTS.find(e => e.name === 'BUG');
  }
  if (!evt) {
    evt = EVENTS[0];
  }

  const x = 100 + Math.random() * 600;
  const y = 100 + Math.random() * 440;

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
    sprite = scene.add.image(x, y, evt.icon).setDisplaySize(40, 40).setOrigin(0.5, 0.5);
  }

  sprite.setDepth(7);

  events.push({
    x,
    y,
    vx,
    vy,
    mobile,
    sprite,
    facing,
    label: EVENT_LABELS[evt.name] || evt.name,
    ...evt
  });
}

function draw() {
  graphics.clear();
  
  // Draw bases
  graphics.fillStyle(p1.color, 0.3);
  graphics.fillRect(p1.base.x, p1.base.y, p1.base.w, p1.base.h);
  graphics.lineStyle(3, p1.color, 1);
  graphics.strokeRect(p1.base.x, p1.base.y, p1.base.w, p1.base.h);
  drawRoundWins(p1.base, p1RoundWins, p1.color);
  
  graphics.fillStyle(p2.color, 0.3);
  graphics.fillRect(p2.base.x, p2.base.y, p2.base.w, p2.base.h);
  graphics.lineStyle(3, p2.color, 1);
  graphics.strokeRect(p2.base.x, p2.base.y, p2.base.w, p2.base.h);
  drawRoundWins(p2.base, p2RoundWins, p2.color);
  
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
        evt.sprite.setRotation(Phaser.Math.Angle.Wrap(evt.facing + Math.PI / 2));
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
  statusText.setText(msg);
}

function drawRoundWins(base, wins, color) {
  if (!wins) return;
  const spacing = 22;
  const radius = 7;
  const centerY = base.y + base.h + 14;
  const startX = base.x + base.w / 2 - ((wins - 1) * spacing) / 2;
  graphics.lineStyle(2, 0x000000, 0.6);
  for (let i = 0; i < wins; i++) {
    const cx = startX + i * spacing;
    graphics.fillStyle(color, 0.9);
    graphics.fillCircle(cx, centerY, radius);
    graphics.strokeCircle(cx, centerY, radius);
  }
}

function startBackgroundMusic(scene) {
  const ctx = scene.sound.context;
  if (!ctx) return;
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(.4, ctx.currentTime + 2);
    musicGain.connect(ctx.destination);
  }

  const beat = 0.35;
  const melody = [523.25, 0, 587.33, 659.25, 0, 587.33, 523.25, 440];
  const harmony = [392, 0, 440, 0, 349.23, 0, 392, 0];
  const bass = [196, 0, 220, 0, 174.61, 0, 220, 0];
  const loopDuration = melody.length * beat;

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
      noteGain.gain.linearRampToValueAtTime(amp, time + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      osc.onended = () => {
        osc.disconnect();
        noteGain.disconnect();
      };
      osc.start(time);
      osc.stop(time + length + 0.02);
    };

    melody.forEach((freq, idx) => {
      if (!freq) return;
      const t = baseTime + idx * beat;
      createTone(freq, t, beat * 0.9, 0.05, 'triangle');
    });

    harmony.forEach((freq, idx) => {
      if (!freq) return;
      const t = baseTime + idx * beat;
      createTone(freq, t, beat * 0.85, 0.035, 'sine');
    });

    bass.forEach((freq, idx) => {
      if (!freq) return;
      const t = baseTime + idx * beat;
      createTone(freq, t, beat * 1.1, 0.06, 'sawtooth');
    });

    const percussionTimes = [0, 2, 4, 6].map(step => baseTime + step * beat);
    percussionTimes.forEach(t => {
      const noise = ctx.createOscillator();
      const gain = ctx.createGain();
      noise.type = 'square';
      noise.frequency.setValueAtTime(40, t);
      noise.connect(gain);
      gain.connect(musicGain);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      noise.onended = () => {
        noise.disconnect();
        gain.disconnect();
      };
      noise.start(t);
      noise.stop(t + 0.25);
    });
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

function endGame(scene) {
  gameOver = true;
  const winner = p1Progress > p2Progress ? 'PLAYER 1' : 
                 p2Progress > p1Progress ? 'PLAYER 2' : 'TIE';
  const winColor = p1Progress > p2Progress ? '#0099ff' : 
                   p2Progress > p1Progress ? '#00ff66' : '#ffff00';
  const playerLabel = winner !== 'TIE' ? PLAYER_LABELS[winner] : null;
  
  if (winner === 'PLAYER 1') p1RoundWins++;
  else if (winner === 'PLAYER 2') p2RoundWins++;
  clearResources();
  clearEvents();
  setPlayersVisible(false);
  
  playTone(scene, winner === 'TIE' ? 440 : 880, 0.3);
  
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.82);
  overlay.fillRect(0, 0, 800, 600);
  
  const roundMessage = playerLabel 
    ? `${playerLabel} gana la Ronda ${currentRound}!`
    : `La Ronda ${currentRound} termina en empate!`;
  
  if (roundText) {
    roundText.setText(`Ronda ${currentRound} completada`);
  }
  updateStatus(roundMessage);
  
  scene.add.text(400, 220, roundMessage, {
    fontSize: '40px',
    color: winColor,
    fontWeight: 'bold',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(1000);

  const finalRound = currentRound >= MAX_ROUNDS;
  if (finalRound) {
    const totalWinnerKey = p1RoundWins > p2RoundWins ? 'PLAYER 1' :
                        p2RoundWins > p1RoundWins ? 'PLAYER 2' : null;
    const totalWinnerLabel = totalWinnerKey ? PLAYER_LABELS[totalWinnerKey] : null;
    const agiMessage = totalWinnerLabel ? `${totalWinnerLabel} logró la AGI!` : 'No hay AGI hoy - empate!';
    if (roundText) roundText.setText('Partida completada');
    updateStatus(agiMessage);
    const agiText = scene.add.text(400, 340, agiMessage, {
      fontSize: totalWinnerLabel ? '36px' : '32px',
      color: '#ffff66'
    }).setOrigin(0.5).setDepth(1000);
    
    const restartTxt = scene.add.text(400, 410, 'Presiona START para reiniciar la partida', {
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
    let countdown = 3;
    if (nextRoundText) {
      nextRoundText.destroy();
    }
    nextRoundText = scene.add.text(400, 340, '', {
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
          currentRound++;
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
  
  p1.x = 100; p1.y = 100;
  p2.x = 700; p2.y = 500;
  p1.inventory = { DATA: 0, COMPUTE: 0, FUNDING: 0 };
  p2.inventory = { DATA: 0, COMPUTE: 0, FUNDING: 0 };
  if (nextRoundText) {
    nextRoundText.destroy();
    nextRoundText = null;
  }
  setPlayerFacing(p1, 'south');
  setPlayerFacing(p2, 'north');
  if (p1.sprite) {
    p1.runCycle = 0;
    p1.bobOffset = 0;
    p1.sprite.setPosition(p1.x, p1.y);
  }
  if (p2.sprite) {
    p2.runCycle = 0;
    p2.bobOffset = 0;
    p2.sprite.setPosition(p2.x, p2.y);
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

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
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
  if (typeof player.runCycle !== 'number') player.runCycle = 0;
  if (typeof player.bobOffset !== 'number') player.bobOffset = 0;

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

  if (moving) {
    player.runCycle += (absDx + absDy) * 0.35;
    const hopPhase = (Math.sin(player.runCycle) + 1) * 0.5;
    const targetBob = -Math.pow(hopPhase, 1.4) * HOP_HEIGHT;
    player.bobOffset = Phaser.Math.Linear(player.bobOffset, targetBob, 0.45);
  } else {
    player.bobOffset = Phaser.Math.Linear(player.bobOffset, 0, 0.2);
    player.runCycle = Phaser.Math.Angle.Wrap(player.runCycle);
  }

  player.sprite.rotation = 0;
  player.sprite.setPosition(player.x, player.y + player.bobOffset);
}

function playerHasResources(player) {
  for (const key in player.inventory) {
    if (player.inventory[key] > 0) return true;
  }
  return false;
}

function playerInBase(player) {
  const base = player.base;
  const bounds = getPlayerBounds(player);
  return !(bounds.right < base.x ||
           bounds.left > base.x + base.w ||
           bounds.bottom < base.y ||
           bounds.top > base.y + base.h);
}

function getPlayerBounds(player) {
  const halfW = PLAYER_HITBOX_WIDTH / 2;
  const spriteHalfHeight = player.sprite ? player.sprite.displayHeight / 2 : PLAYER_HITBOX_HEIGHT / 2;
  const bottom = player.y + spriteHalfHeight;
  const top = bottom - PLAYER_HITBOX_HEIGHT;
  return {
    left: player.x - halfW,
    right: player.x + halfW,
    top,
    bottom
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
    if (p1BoostText) {
      p1BoostText.setVisible(true);
      p1BoostText.setText('Cafeína: ' + Math.ceil(p1Boost / 1000) + 's');
    }
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
