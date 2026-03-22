System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, Color, _crd, PTD_UI_THEME;

  function getPageTheme(faction) {
    return PTD_UI_THEME[faction];
  }
  /** 預留 Shader / Material 切換接口（後續美術資源到位後填入） */


  function applyFactionMaterial(sprite, faction, turbidMaterial, pureMaterial) {
    const mat = faction === 'Turbid' ? turbidMaterial : pureMaterial;

    if (mat) {
      sprite.customMaterial = mat; // Shader Uniform 預留點（後續填入）
      // mat.setProperty('u_crackIntensity', 0.0);
      // mat.setProperty('u_fogDensity', 0.0);
    }
  }

  _export({
    getPageTheme: getPageTheme,
    applyFactionMaterial: applyFactionMaterial
  });

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      Color = _cc.Color;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "e4fddLqA85KTrt31orACfE+", "PTD_UI_Theme", undefined);

      __checkObsolete__(['Color', 'Material', 'Sprite']);

      _export("PTD_UI_THEME", PTD_UI_THEME = {
        Pure: {
          bgBase: new Color(217, 215, 197),
          textPrimary: new Color(90, 78, 68),
          textSecondary: new Color(139, 115, 85),
          primary: new Color(184, 159, 134),
          border: new Color(184, 159, 134, 77),
          // rgba(184,159,134,0.3)
          shadowLg: new Color(100, 90, 75, 46),
          // rgba(100,90,75,0.18)
          shadowMd: new Color(100, 90, 75, 38) // rgba(100,90,75,0.15)

        },
        Turbid: {
          bgBase: new Color(19, 8, 38),
          textPrimary: new Color(228, 213, 245),
          textSecondary: new Color(197, 168, 224),
          primary: new Color(155, 89, 182),
          border: new Color(124, 58, 237, 102),
          // rgba(124,58,237,0.4)
          shadowLg: new Color(30, 0, 80, 140),
          // rgba(30,0,80,0.55)
          shadowMd: new Color(30, 0, 80, 89) // rgba(30,0,80,0.35)

        }
      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=f7f241739d16c506cd2f8df99e7b147912747d88.js.map