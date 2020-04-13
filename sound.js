/**
 * Handles the generation, playing, and pausing of the sound effects and background music
 * for the game.
 * 
 * The approach used is based on the following codepen post by Jack Rugile:
 * 
 * http://codepen.io/jackrugile/blog/arcade-audio-for-js13k-games
 */
$.Sound = {
  
  /**
   * Stores the sounds, keyed by the sound name.
   */
  sounds: {},
  
  /**
   * Whether the sound module is active in the current browser.
   */
  active: false,
  
  /**
   * Initialised all of the sound effects and the background music.
   */
  init: function() {
    // The sound module only seems to work in Chrome and Firefox.
    this.active = (!(navigator.userAgent.match(/Opera|OPR\//)));
    
    if (this.active) {
      this.add('music', 1, this.song);
      this.add('bomb', 10, [2,,0.2,0.81,0.09,0.6609,,-0.2901,-0.64,,,,,0.072,0.191,,-0.38,-0.02,1,,,0.1841,,0.5]);
      this.add('explosion', 10, [3,,0.3453,0.6998,0.2278,0.08,,-0.0553,,,,-0.2784,0.6294,,,,,,1,,,,,0.52]);
      this.add('count', 1, [2,,0.1707,,0.0644,0.5146,,,,,,,,,,,,,1,,,0.1,,0.5]);
      this.add('online', 10, [2,,0.1583,,0.4507,0.2316,,0.4005,,,,,,0.1841,,0.5019,,,1,,,,,0.5]);
      this.add('offline', 10, [3,,0.2887,0.4888,0.486,0.2153,,-0.3216,,,,,,,,,,,1,,,,,0.52]);
      this.add('dig', 10, [2,0.0109,0.2089,0.2983,0.3261,0.2563,,-0.0176,0.4618,0.0029,-0.6415,-0.2028,0.3867,0.9195,0.6075,0.3908,0.1457,-0.0004,0.967,,0.2442,,-0.5556,0.29]);
      this.add('over', 10, [3,,0.1773,0.5825,0.2496,0.1643,,-0.2568,,0.0472,,-0.5554,0.7768,,-0.049,0.39,0.52,0.34,0.53,,0.0217,,-0.0402,0.5]);
      this.add('no', 10, [3,,0.01,,0.2919,0.3286,,-0.6152,,,,,,,,,,,1,,,,,0.48]);
    }
    
    // 3,,0.2655,0.2852,0.386,0.1381,0.0099,0.1341,,0.1363,,0.07,0.013,,0.0914,0.0414,0.3126,-0.397,0.9803,0.0278,0.0606,,0.0574,0.5
    
    // 3,,0.1773,0.5825,0.2496,0.1643,,-0.2568,,0.0472,,-0.5554,0.7768,,-0.049,0.39,0.52,0.34,0.53,,0.0217,,-0.0402,0.5
    
    // Game over noise?  2,0.2958,0.0124,0.0196,0.6648,0.5017,,-0.0131,-0.1809,,0.5154,-0.1317,0.0986,0.0598,-0.0981,0.1138,0.1542,0.1967,0.7161,0.0164,0.3783,0.0246,-0.0871,0.5
    
    // Shadow Ball level cleared noise: 2,0.0738,0.9417,0.1338,0.1844,0.504,,-0.0519,0.1093,0.1416,0.696,0.4653,0.0134,0.2708,-0.2926,-0.1538,,-0.0891,0.997,0.0084,0.7638,0.0076,0.6493,0.5
    
    // Hit:
    // 0,,0.0243,,0.1556,0.4446,,-0.6015,,,,,,0.2088,,,,,1,,,,,0.48
    // 3,,0.01,,0.2919,0.3286,,-0.6152,,,,,,,,,,,1,,,,,0.48  <<-- sounds pretty good
    // 3,,0.0945,,0.281,0.2105,,-0.5129,,,,,,,,,,,1,,,,,0.48
    
    // Explosion: 
    // 3,,0.2992,0.2225,0.2698,0.04,,-0.031,,0.24,0.12,0.3272,0.7248,,,0.3947,0.5945,-0.0882,1,,,,,0.5
    // 3,,0.1527,0.6742,0.3473,0.018,,0.0425,,,,,,,,,0.2314,-0.0231,1,,,,,0.5
    // 3,,0.1283,0.6002,0.4009,0.06,,,,,,,,,,,-0.0393,-0.2507,1,,,,,0.5
    // 3,,0.3276,0.6413,0.3615,0.23,,-0.2044,,,,-0.1999,0.78,,,0.38,,0.02,1,,,,,0.33
    // 3,,0.3317,0.2178,0.2128,0.7578,,-0.3644,,,,-0.6281,0.7217,,,,0.4101,-0.1168,1,,,,,0.52
    // 3,,0.3317,0.2178,0.2128,0.7578,,-0.3644,,,,-0.6281,0.7217,,,,0.4101,-0.1168,1,,,,,0.52
    // 3,,0.2396,0.4346,0.456,0.0329,,0.193,,,,,,,,,0.0168,-0.2357,1,,,,,0.52
    // 3,,0.2887,0.4888,0.486,0.2153,,-0.3216,,,,,,,,,,,1,,,,,0.52    <<-- possibility
    // 3,,0.3453,0.6998,0.2278,0.08,,-0.0553,,,,-0.2784,0.6294,,,,,,1,,,,,0.52  <<-- another
    
    // Sound cool:
    // 0,,0.2992,0.2225,0.2698,0.04,,-0.031,,0.24,0.12,0.3272,0.7248,,,0.3947,0.5945,-0.0882,1,,,,,0.5
    
    // Powerup examples:
    // 0,,0.1583,,0.4507,0.2316,,0.4005,,,,,,0.1841,,0.5019,,,1,,,,,0.5
    // 2,,0.1583,,0.4507,0.2316,,0.4005,,,,,,0.1841,,0.5019,,,1,,,,,0.5
    // 2,,0.234,,0.2551,0.346,,0.1302,,,,,,0.1238,,0.5264,,,1,,,,,0.5
    // 2,,0.1144,,0.4867,0.2551,,0.3979,,,,,,0.0245,,0.6581,,,1,,,,,0.5
    // 0,,0.2389,,0.4791,0.3874,,0.12,,0.38,0.4604,,,,,,,,0.99,,,,,0.5
    // 2,,0.2389,,0.4791,0.3874,,0.12,,0.38,0.4604,,,,,,,,0.99,,,,,0.5
    // 2,,0.1454,,0.3698,0.2002,,0.2469,,,,,,0.1781,,,,,1,,,,,0.5
    
    // Pickup
    // 2,,0.0884,0.3246,0.253,0.4304,,,,,,0.379,0.5518,,,,,,1,,,,,0.5
    // 2,,0.01,0.557,0.3303,0.4434,,,,,,0.5368,0.5981,,,,,,1,,,,,0.5
    // 2,,0.0425,0.3922,0.2535,0.4762,,,,,,0.4706,0.5751,3,,0.1527,0.6742,0.3473,0.018,,0.0425,,,,,,,,,0.2314,-0.0231,1,,,,,0.5,,,,,1,,,,,0.5
    
    // Countdown
    // 2,,0.173,,0.0097,0.2642,,,,,,,,0.3898,,,,,1,,,0.1,,0.5
    // 2,,0.1353,,0.0592,0.247,,,,,,,,0.0502,,,,,1,,,0.1,,0.5
    // 2,,0.1741,,0.1792,0.3088,,,,,,,,,,,,,1,,,0.1,,0.5
    // 2,,0.1125,,0.177,0.3212,,,,,,,,,,,,,1,,,0.1,,0.5
    // 2,,0.1934,,0.156,0.25,,,,,,,,0.0652,,,,,1,,,0.1,,0.5
    // 2,,0.1707,,0.0644,0.5146,,,,,,,,,,,,,1,,,0.1,,0.5
    // 2,,0.1083,,0.1424,0.5657,,,,,,,,0.0676,,,,,1,,,0.1,,0.5
    
    // Interesting noises:
    // 3,,0.1527,0.6742,0.3473,0.018,,0.0425,,,,,,,,,0.2314,-0.0231,1,,,,,0.5
    // 1,,0.8171,0.1411,0.0133,0.2702,,-0.0948,-0.1266,0.0148,,-0.9776,0.434,-0.8594,-0.1462,0.1343,0.2307,-0.0184,0.6643,0.501,,,0.2704,0.48  << -- Really cool
    // 3,0.0012,0.058,0.0191,0.8588,0.5204,,-0.0001,-0.303,-0.0234,-0.3006,-0.107,0.9644,-0.2244,,0.3505,-0.971,,0.937,0.4208,,0.188,-0.1718,0.48
    // 1,0.0211,0.0118,0.1212,0.3302,0.5455,,0.134,0.1033,-0.0597,0.4831,-0.7084,0.9199,-0.3849,0.298,,-0.248,-0.0542,0.3558,-0.0163,0.7575,,0.1156,0.29  <<-- jumping noise?
    // 2,0.0109,0.2089,0.2983,0.3261,0.2563,,-0.0176,0.4618,0.0029,-0.6415,-0.2028,0.3867,0.9195,0.6075,0.3908,0.1457,-0.0004,0.967,,0.2442,,-0.5556,0.29  << -- absorb??
    // 2,0.2958,0.0124,0.0196,0.6648,0.5017,,-0.0131,-0.1809,,0.5154,-0.1317,0.0986,0.0598,-0.0981,0.1138,0.1542,0.1967,0.7161,0.0164,0.3783,0.0246,-0.0871,0.5
    // 2,0.0738,0.9417,0.1338,0.1844,0.504,,-0.0519,0.1093,0.1416,0.696,0.4653,0.0134,0.2708,-0.2926,-0.1538,,-0.0891,0.997,0.0084,0.7638,0.0076,0.6493,0.5
    // 1,0.3051,0.5658,0.1471,0.4489,0.24,,0.0094,-0.0176,-0.2856,,-0.3216,0.5162,0.4895,0.0104,0.2618,0.1002,0.7442,0.2891,-0.0987,-0.5269,0.0142,,0.5
    
  },
  
  /**
   * Generates a sound using the given data and adds it to the stored sounds under the 
   * given name. It will generate the sound multiple times if count is greater than one.
   * This method handles both jsfxr sounds and SoundBox compositions.
   * 
   * @param {Object} name The name of the sound to create. This is the key in the stored sounds.
   * @param {Object} count The number of times to generate the sound.
   * @param {Object} data The data containing the parameters of the sound to be generated.
   */
  add: function(name, count, data) {
    this.sounds[name] = {tick: 0, count: count, pool: []};
    for (var i = 0; i < count; i++) {
      var audio = new Audio();
      if (data instanceof Array) {
        // If it is an Array, it must be jsfxr data.
        audio.src = jsfxr(data);
        audio.volume = 0.4;
      } else {
        // Otherwise it is SoundBox data.
        var player = new CPlayer();
        player.init(data);
        // Using only 5 instruments. This saves a bit of space.
        player.generate();
        player.generate();
        player.generate();
        player.generate();
        player.generate();
        audio.src = URL.createObjectURL(new Blob([player.createWave()], {type: "audio/wav"}));
        // This is background music, so we set it to loop and turn the volume down a bit.
        audio.loop = true;
        audio.volume = 1.0;
      }
      this.sounds[name].pool.push(audio);
    }
  },
  
  /**
   * Plays the sound of the given name. All sounds are stored as pre-generated Audio 
   * objects. So it is simply a matter of telling it to play. Some sounds have multiple
   * copies, particularly if the sound can be played in quick succession, potentially
   * overlapping. In such a case, it can't use the same Audio, so iterates over a pool
   * of Audios containing the same sound.  
   * 
   * @param {string} name The name of the sound to play.
   */
  play: function(name) {
    if (this.active) {
      var sound = this.sounds[name];
      sound.pool[sound.tick].play();
//      if (promise !== undefined) {
//        promise.then(_ => {
//          // Autoplay started!
//          sound.tick < sound.count - 1 ? sound.tick++ : sound.tick = 0;
//        }).catch(error => {
//          // Autoplay was prevented.
//        });
//      }
    }
  },
  
  /**
   * Pauses the sound of the given name. This is only useful if the count is one, such
   * as for the background music. The current position within the Audio is also set 
   * back to the beginning so that when it is resumed, it starts at the beginning 
   * again.
   *  
   * @param {string} name The name of the sound to pause.
   */
  pause: function(name) {
    if (this.active) {
      var audio = this.sounds[name].pool[0];
      audio.pause();
      audio.currentTime = 0;
    }
  },
  
  /**
   * This is background music, composed on and generated by the SoundBox. It is an 
   * original composition composed by the author of Shadow Ball, specifically for 
   * Shadow Ball.
   */
  song: {
      songData: [
          { // Instrument 0
            i: [
            0, // OSC1_WAVEFORM
            255, // OSC1_VOL
            128, // OSC1_SEMI
            0, // OSC1_XENV
            0, // OSC2_WAVEFORM
            255, // OSC2_VOL
            140, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            20, // NOISE_VOL
            11, // ENV_ATTACK
            8, // ENV_SUSTAIN
            23, // ENV_RELEASE
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            96, // LFO_AMT
            3, // LFO_FREQ
            1, // LFO_FX_FREQ
            3, // FX_FILTER
            94, // FX_FREQ
            79, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            84, // FX_PAN_AMT
            2, // FX_PAN_FREQ
            12, // FX_DELAY_AMT
            4 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1,2,3,4,1,2,3,4,5,6,7,6,5,6,7,6,5,6,7,6,5,6,7,6],
            // Columns
            c: [
              {n: [135,,,,135,,,,135,,,,135,,,,135,,,,135,,,,135,,,,135],
               f: []},
              {n: [139,,,,139,,,,139,,,,139,,,,139,,,,139,,,,139,,,,139],
               f: []},
              {n: [140,,,,140,,,,140,,,,140,,,,140,,,,140,,,,140,,,,140],
               f: []},
              {n: [142,,,,142,,,,142,,,,142,,,,142,,,,142,,,,142,,,,142],
               f: []},
              {n: [132,,,,132,,,,132,,,,132,,,,132,,,,132,,,,132,,,,132],
               f: []},
              {n: [130,,,,130,,,,130,,,,130,,,,130,,,,130,,,,130,,,,130],
               f: []},
              {n: [128,,,,128,,,,128,,,,128,,,,128,,,,128,,,,128,,,,128],
               f: []}
            ]
          },
          { // Instrument 1
            i: [
            3, // OSC1_WAVEFORM
            28, // OSC1_VOL
            128, // OSC1_SEMI
            0, // OSC1_XENV
            3, // OSC2_WAVEFORM
            28, // OSC2_VOL
            128, // OSC2_SEMI
            12, // OSC2_DETUNE
            0, // OSC2_XENV
            0, // NOISE_VOL
            12, // ENV_ATTACK
            0, // ENV_SUSTAIN
            72, // ENV_RELEASE
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            0, // LFO_AMT
            0, // LFO_FREQ
            0, // LFO_FX_FREQ
            2, // FX_FILTER
            255, // FX_FREQ
            0, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            83, // FX_PAN_AMT
            3, // FX_PAN_FREQ
            130, // FX_DELAY_AMT
            4 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1,2,1,3,1,2,1,3,4,5,4,5,4,5,4,5,1,2,1,3,1,2,1,3],
            // Columns
            c: [
              {n: [134,,,,,,135,,,,,,,,,,,,,,135,,137,,,,135,,,,,,137,,,,,,139,,,,,,,,,,,,,,139,,140,,,,139],
               f: []},
              {n: [134,,,,,,135,,,,,,,,,,,,,,134,,135,,,,134,,,,,,137,,,,,,139,,,,,,,,,,,,,,137,,139,,,,137],
               f: []},
              {n: [134,,,,,,135,,,,,,134,,,,135,,,,134,,135,,,,134,,,,,,137,,,,,,139,,,,,,137,,,,139,,,,137,,139,,,,137],
               f: []},
              {n: [130,,,,,,132,,,,,,,,,,,,,,132,,,,,,,,,,,,134,,,,,,135,,,,,,,,,,,,,,135,,140,,,,139],
               f: []},
              {n: [130,,,,,,130,,,,,,130,,,,130,,,,130,,130,,,,130,,,,,,134,,,,,,135,,,,,,134,,,,135,,,,134,,135,,,,134],
               f: []}
            ]
          },
          { // Instrument 2
            i: [
            0, // OSC1_WAVEFORM
            0, // OSC1_VOL
            140, // OSC1_SEMI
            0, // OSC1_XENV
            0, // OSC2_WAVEFORM
            0, // OSC2_VOL
            140, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            255, // NOISE_VOL
            158, // ENV_ATTACK
            158, // ENV_SUSTAIN
            158, // ENV_RELEASE
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            51, // LFO_AMT
            2, // LFO_FREQ
            1, // LFO_FX_FREQ
            2, // FX_FILTER
            58, // FX_FREQ
            239, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            88, // FX_PAN_AMT
            1, // FX_PAN_FREQ
            157, // FX_DELAY_AMT
            2 // FX_DELAY_TIME
            ],
            // Patterns
            p: [,,,,,,,,1,,2,,1,,2,,1,,2,,1,,2],
            // Columns
            c: [
              {n: [132],
               f: []},
              {n: [128],
               f: []}
            ]
          },
          { // Instrument 3
            i: [
            0, // OSC1_WAVEFORM
            109, // OSC1_VOL
            116, // OSC1_SEMI
            1, // OSC1_XENV
            0, // OSC2_WAVEFORM
            107, // OSC2_VOL
            116, // OSC2_SEMI
            0, // OSC2_DETUNE
            1, // OSC2_XENV
            0, // NOISE_VOL
            4, // ENV_ATTACK
            6, // ENV_SUSTAIN
            35, // ENV_RELEASE
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            0, // LFO_AMT
            0, // LFO_FREQ
            0, // LFO_FX_FREQ
            2, // FX_FILTER
            14, // FX_FREQ
            0, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            0, // FX_PAN_AMT
            0, // FX_PAN_FREQ
            0, // FX_DELAY_AMT
            0 // FX_DELAY_TIME
            ],
            // Patterns
            p: [,,,,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            // Columns
            c: [
              {n: [147,,,,,,147,,,,,,,,,,147,,,,,,147],
               f: []}
            ]
          },
          { // Instrument 4
            i: [
            0, // OSC1_WAVEFORM
            0, // OSC1_VOL
            140, // OSC1_SEMI
            0, // OSC1_XENV
            0, // OSC2_WAVEFORM
            0, // OSC2_VOL
            140, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            60, // NOISE_VOL
            4, // ENV_ATTACK
            10, // ENV_SUSTAIN
            34, // ENV_RELEASE
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            187, // LFO_AMT
            5, // LFO_FREQ
            0, // LFO_FX_FREQ
            1, // FX_FILTER
            239, // FX_FREQ
            135, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            108, // FX_PAN_AMT
            5, // FX_PAN_FREQ
            16, // FX_DELAY_AMT
            4 // FX_DELAY_TIME
            ],
            // Patterns
            p: [,,,,,,,3,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2],
            // Columns
            c: [
              {n: [,,,,,,,,147,,,,,,,,,,,,,,,,147],
               f: []},
              {n: [,,,,,,,,147,,,,,,,,,,,,,,,,147,,,,,,147],
               f: []},
              {n: [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,147],
               f: []}
            ]
          }
        ],
        rowLen: 4134,   // In sample lengths
        patternLen: 32,  // Rows per pattern
        endPattern: 23,  // End pattern
        numChannels: 5  // Number of channels
      }
};