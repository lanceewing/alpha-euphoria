/**
 * The is the core Game object that manages the starting of the game loop and the
 * core functions of the game that don't relate directly to an individual screen object.
 */
$.Game = {

    /**
     * The time of the last animation frame. 
     */ 
    lastTime: 0,
    
    /**
     * The time difference between the last animation frame and the current animaton frame.
     */  
    delta: 0,
    
    /**
     * Whether or not the user currently has control.
     */
    userInput: true,

    /**
     * The current level on the space station.
     */
    level: 3,

    /**
     * Last random number in the sequence. Always starts with same seed.
     */
    lastRandom: 481731,

    /**
     * Rooms have: 0=deck/1=hallway, 0=normal/lower room, room width, left edge, left path, left door up,
     * right door up, right path, right edge, right door down, left door down.
     * 
     */
    rooms: [
 
      // Hallways level 1.
      [0x01, 0x00, 1920,     ,    4,    5,    5,    2,     ,     ,      ],  // 1 Hall
      [0x01, 0x00, 1920,     ,    1,    6,    6,    3,     ,     ,      ],  // 2
      [0x01, 0x00, 1920,     ,    2,    7,    7,    4,     ,     ,      ],  // 3
      [0x01, 0x00, 1920,     ,    3,    8,    8,    1,     ,     ,      ],  // 4

      // Decks level 1.
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,    1,    1 ],  // 5 Deck
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,    2,    2 ],  // 6
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,    3,    3 ],  // 7
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,    4,    4 ],  // 8

      // Hallways level 2.
      [0x01, 0x00, 1920,     ,   12,   13,   13,   10,     ,     ,      ],  // 9 Hall
      [0x01, 0x00, 1920,     ,    9,   14,   14,   11,     ,     ,      ],  // 10
      [0x01, 0x00, 1920,     ,   10,   15,   15,   12,     ,     ,      ],  // 11
      [0x01, 0x00, 1920,     ,   11,   16,   16,    9,     ,     ,      ],  // 12

      // Decks level 2.
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,    9,    9 ],  // 13 Deck
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   10,   10 ],  // 14
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   11,   11 ],  // 15
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   12,   12 ],  // 16

      // Hallways level 3.
      [0x01, 0x00, 1920,     ,   20,   21,   21,   18,     ,     ,      ],  // 17 Hall
      [0x01, 0x00, 1920,     ,   17,   22,   22,   19,     ,     ,      ],  // 18
      [0x01, 0x00, 1920,     ,   18,   23,   23,   20,     ,     ,      ],  // 19
      [0x01, 0x00, 1920,     ,   19,   24,   24,   17,     ,     ,      ],  // 20

      // Decks level 3.
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   17,   17 ],  // 21 Deck
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   18,   18 ],  // 22
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   19,   19 ],  // 23
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   20,   20 ],  // 24

      // Hallways level 4.
      [0x01, 0x00, 1920,     ,   28,   29,   29,   26,     ,     ,      ],  // 25 Hall
      [0x01, 0x00, 1920,     ,   25,   30,   30,   27,     ,     ,      ],  // 26
      [0x01, 0x00, 1920,     ,   26,   31,   31,   28,     ,     ,      ],  // 27
      [0x01, 0x00, 1920,     ,   27,   32,   32,   25,     ,     ,      ],  // 28

      // Decks level 4.
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   25,   25 ],  // 29 Deck
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   26,   26 ],  // 30
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   27,   27 ],  // 31
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   28,   28 ],  // 32

      // Hallways level 5.
      [0x01, 0x00, 1920,     ,   36,   37,   37,   34,     ,     ,      ],  // 33 Hall
      [0x01, 0x00, 1920,     ,   33,   38,   38,   35,     ,     ,      ],  // 34
      [0x01, 0x00, 1920,     ,   34,   39,   39,   36,     ,     ,      ],  // 35
      [0x01, 0x00, 1920,     ,   35,   40,   40,   33,     ,     ,      ],  // 36

      // Decks level 5.
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   33,   33 ],  // 37 Deck
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   34,   34 ],  // 38
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   35,   35 ],  // 39
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   36,   36 ],  // 40

      // Hallways level 6.
      [0x01, 0x00, 1920,     ,   44,   45,   45,   42,     ,     ,      ],  // 41 Hall
      [0x01, 0x00, 1920,     ,   41,   46,   46,   43,     ,     ,      ],  // 42
      [0x01, 0x00, 1920,     ,   42,   47,   47,   44,     ,     ,      ],  // 43
      [0x01, 0x00, 1920,     ,   43,   48,   48,   41,     ,     ,      ],  // 44

      // Decks level 6.
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   41,   41 ],  // 45 Deck
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   42,   42 ],  // 46
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   43,   43 ],  // 47
      [0x00, 0x00, 1920,     ,     ,     ,     ,     ,     ,   44,   44 ],  // 48
    ],

    /*
      8  - Door open
      9  - Door unlocked
      10 - Door colour
      11 - Pulled reaper
      12 - Reaper dead

    */

    /**
     * Boolean flags that remember when certain things have happened in the game.
     */
    flags: {},

    /**
     * Props (things) that are in each room.
     */
    props: [
      
      // Room#, type, name, width, height, x, y, element reference, zindex, colour
      // types: 0 = actor, 1 = item, 2 = prop

      // [62, 1, 'green_key', 18, 3, 455, 540, null],

    ],
    
    actors: [],

    inventory: {},
    
    verb: 'Walk to',
    
    command: 'Walk to',   // Current constructed command, either full or partial
    
    thing: '',
    
    itemTop: -1,
    
    _gameOver: true,
    
    score: 0,

    /**
     * The time in milliseconds since the current game started.
     */
    time: 0,
      
    /**
     * Scales the screen div to fit the whole screen.
     */
    fillScreen: function() {
      $.scaleX = window.innerWidth / $.wrap.offsetWidth;
      $.scaleY = window.innerHeight / $.wrap.offsetHeight;
      $.wrap.style.transform = "scale3d(" + $.scaleX + ", " + $.scaleY + ", 1)";
      $.wrap.style.marginLeft = ((window.innerWidth - 960) / 2) + "px";    // Width of the game screen is 960.
      // TODO: Decide whether this is needed.
      //$.screen.style.width = (window.innerWidth > 960? window.innerWidth : 960) + "px";
    },

    /**
     * Starts the game. 
     */
    start: function() {
      // Trigger fetch of voices up front.
      window.speechSynthesis.getVoices();

      // Get a reference to each of the elements in the DOM that we'll need to update.
      $.wrap = document.getElementById('wrap');
      $.screen = document.getElementById('screen');
      $.screenWrap =document.getElementById('screen_wrap');
      $.space = document.getElementById('space');
      $.wall = document.getElementsByClassName('wall')[0];
      $.time = document.getElementById('time');
      $.score = document.getElementById('score');
      $.items = document.getElementById('itemlist');
      $.sentence = document.getElementById('sentence');
      $.controls = document.getElementById('controls');
      $.msg = document.getElementById('msg');
      $.overlay = document.getElementById('overlay');
      $.direction = document.getElementsByClassName('direction');
      $.level = document.getElementsByClassName('level');
      $.leftDoor = document.getElementById('left_door');
      $.rightDoor = document.getElementById('right_door');
      $.elevatorPanel = document.getElementById('elevator_panel');
      $.elevator = document.getElementById('elevator');
      $.elevatorSign = document.getElementById('elevator_sign');

      this.fillScreen();
      
      window.addEventListener("resize", function() { $.Game.fillScreen(); }); 

      // Render the star field
      let starField = this.renderStarField();
      $.wrap.style.backgroundImage = 'url(' + starField.toDataURL("image/png") + ')';
      
      // Register click event listeners for item list arrow buttons.
      document.getElementById("up").addEventListener("click", function(){
        $.Game.scrollInv(1);
      });
      document.getElementById("down").addEventListener("click", function(){
        $.Game.scrollInv(-1);
      });
      
      var verbs = document.getElementById('commands').children;
      for (var i=0; i<verbs.length; i++) {
        verbs[i].addEventListener("click", function(e) {
          $.Game.command = $.Game.verb = e.target.innerHTML;
        });
      }

      // Add event listeners for elevator buttons.
      var elevatorButtons = document.getElementById('elevator_panel').getElementsByTagName('button');
      for (let i=0; i<elevatorButtons.length; i++) {
        elevatorButtons[i].onclick = function(e) {
          let elem = e.target;
          let floor = elem.dataset.value;
          let floorDiff = floor - $.Game.level;
          $.Game.room = $.Game.room + (8 * floorDiff);
          $.ego.room = $.Game.room;
          $.elevatorPanel.style.display = 'none';
          $.ego.setDirection(Sprite.OUT);
          $.Game.fadeOut($.screenWrap);
          setTimeout(function() {
            $.Game.newRoom();
            $.Game.setLevel(floor);
            $.ego.moveTo($.ego.x, 600, function() {
              $.elevator.classList.remove('open');
              $.Game.userInput = true;
            });
          }, 500);
        };
      }
      
      // Start in game over mode.
      this.gameOver();
    },

    /**
     * Sets the current space station level.
     * 
     * @param {*} level 
     */
    setLevel: function(level) {
      let levelText = ['I', 'II', 'III', 'IV', 'V', 'VI'][level - 1];
      $.level[0].textContent = levelText;
      $.level[1].textContent = levelText;
      $.elevatorSign.textContent = levelText;
      $.Game.level = level;
    },

    /**
     * 
     */
    gameOver: function(msg) {
      this.userInput = true;
      this.fadeOut($.screenWrap);
      if (msg) {
        $.msg.innerHTML = msg;
      }
      $.msg.style.display = 'block';
      this.fadeIn($.msg);
      if (!msg) {
        window.onclick = function(e) {
          //if (document.fullscreenEnabled) {
          //  document.documentElement.requestFullscreen();
          //}
          $.Game.fadeOut($.msg);
          setTimeout(function() {
            $.msg.style.display = 'none';
          }, 200);
          setTimeout(function(e) {
            $.Game.init();
            $.Game.loop();
          }, 500);


          // TODO: Intro song will be DIFFER1. NEW10 will be played after the drama starts. 
          // TODO: Pre-buffer time will avoid jerky playback.
          // TODO: Starting to prebuffer songs during the "Click to play" but before starting to use audio might work.
          // TODO: load function supports a callback function for when the processing has finished.
          // TODO: Sample rate can be set, which might give us better performance for worse quality.
          // TODO: Do we have a way of detecting when the realtime playback finishes?
          // TODO: Player can be paused.

          // // Starting playing ROL file in the background.
          // fetch('./songs/NEW10.ROL').then(function(res){
          //   return res.arrayBuffer();
          // }).then(function(rol){
          //     fetch('./songs/STANDARD.BNK').then(function(res){
          //         return res.arrayBuffer();
          //     }).then(function(standardBank){
          //         var player = new OPL3.Player(OPL3.format.ROL, {
          //             instruments: standardBank,
          //             prebuffer: 10000,
          //             volume: 3
          //         });
          //         player.play(rol);
          //     });
          // });

        };
      }
    },

    /**
     * Initialised the parts of the game that need initialising on both
     * the initial start and then subsequent restarts. 
     */
    init: function() {
      this._gameOver = false;
      this.userInput = true;
      this.time = 0;

      window.onclick = null;

      $.screen.onclick = function(e) {
        $.Game.processCommand(e);
      };

      // For restarts, we'll need to remove the objects from the screen.
      if (this.objs) {
        for (var i=0; i<this.objs.length; i++) {
          this.objs[i].remove();
        }
      }
      
      // Set the room back to the start, and clear the object map.
      this.objs = [];
      this.room = 17;
      
      // Create Ego (the main character) and add it to the screen.
      $.ego = new Ego();
      $.ego.add();
      $.ego.setPosition(234, 0, 600);

      // Add actors into the rooms.
      // TODO: Change this to handle crew???
      this.addActors(200);

      // Starting inventory.
      this.getItem('keycard');
      this.getItem('bottle');
      this.getItem('wrench');
      this.getItem('computer manual');
      this.getItem('rations');
      this.getItem('plastic bucket');
      
      // Enter the starting room.
      this.newRoom();
      
      // // Intro text.
      // this.userInput = false;
      // $.ego.say('Where am I?', 140, function() {
      //   $.ego.moveTo(500, 600, function() {
      //     $.ego.say('Who am I?', 140, function() {
      //       $.ego.moveTo(500, 640, function() {
      //         $.ego.say('And why is there a body over there that looks like me?', 300, function() {
      //           $.Game.userInput = true;
      //         });
      //       });
      //     });
      //   });
      // });
      
      // Fade in the whole screen at the start.
      this.fadeIn($.wrap);
    },
    
    /**
     * This is a wrapper around the main game loop whose primary purpose is to make
     * the this reference point to the Game object within the main game loop. This 
     * is the method invoked by requestAnimationFrame and it quickly delegates to 
     * the main game loop.
     *  
     * @param {number} now Time in milliseconds.
     */
    _loop: function(now) {
      $.Game.loop(now);
    },
    
    /**
     * This is the main game loop, in theory executed on every animation frame.
     * 
     * @param {number} now Time. The delta of this value is used to calculate the movements of Sprites.
     */
    loop: function(now) {
      // Immediately request another invocation on the next
      if (!this._gameOver) {
        requestAnimationFrame(this._loop);
      } else {
        return;
      }
      
      // Calculates the time since the last invocation of the game loop.
      this.updateDelta(now);
      
      // Game has focus and is not paused, so execute normal game loop, which is
      // to update all objects on the screen.
      this.updateObjects();

      // Small hack to account for the rotation of the planet. Not required in Firefox.
      $.space.style.zIndex = -3;
      
      // Adjust screen left to account for scrolling.
      if ($.ego.isVisible()) {
        $.screenLeft = $.ego.x - (960 / 2);
        if ($.screenLeft < 0) $.screenLeft = 0;
        if ($.screenLeft > 960) $.screenLeft = 960;
        $.screen.style.left = '-' + $.screenLeft + 'px';
      }

      if (this.random(600) == 1) {
        this.shakeScreen();
      }

      // Update sentence.
      if (!this._gameOver) {
        $.sentence.innerHTML = this.command + ' ' + this.thing;
      } else {
        $.sentence.innerHTML = 'Game Over';
      }

      $.time.innerHTML = this.buildTimeString(this.time);
      
      // If after updating all objects, the room that Ego says it is in is different
      // than what it was previously in, then we trigger entry in to the new room.
      if ($.ego.room != this.room) {
        this.room = $.ego.room;
        this.fadeOut($.screenWrap);
        setTimeout(function() {
          $.Game.newRoom();
        }, 500);
      }

      // Update cursor and overlay based on user input state.
      $.overlay.style.display = ($.Game.userInput? 'none' : 'block');
      $.wrap.style.cursor = ($.Game.userInput? 'crosshair' : 'wait');
    },
    
    /**
     * For the given number of milliseconds, returns a string representation that includes
     * the minutes and seconds in the format mm:ss
     * 
     * @param numOfMillis The millisecond value to convert to a time in minutes and seconds.
     * 
     * @returns {String} The time as mm:ss
     */
    buildTimeString: function(numOfMillis) {
      var timeLeft = 3600 -  Math.floor(numOfMillis / 1000);
      var minutes = Math.floor(timeLeft / 60);
      var seconds = timeLeft % 60;
      return (('00' + minutes).substr(-2) + ':' + ('00' + seconds).substr(-2));
    },

    /**
     * Updates the delta, which is the difference between the last time and now. Both values
     * are provided by the requestAnimationFrame call to the game loop. The last time is the
     * value from the previous frame, and now is the value for the current frame. The difference
     * between them is the delta, which is the time between the two frames. From this value
     * it can calculate the stepFactor, which is used in the calculation of the Sprites' motion.
     * In this way if a frame is skipped for some reason, the Sprite position will be updated to 
     * compensate.
     * 
     * @param {Object} now The current time provided in the invocation of the game loop.
     */
    updateDelta: function(now) {
      if (now) {
        this.delta = now - (this.lastTime? this.lastTime : (now - 16));
        this.stepFactor = this.delta * 0.06;
        this.lastTime = now;
        this.time += this.delta;
      }
    },
    
    /**
     * The main method invoked on every animation frame when the game is unpaused. It 
     * interates through all of the Sprites and invokes their update method. The update
     * method will invoke the move method if the calculated position has changed. This
     * method then tests if the Sprite is touching another Sprite. If it is, it invokes
     * the hit method on both Sprites. 
     */
    updateObjects: function() {
      var i=-1, j, a1=$.ego, a2;
      var objsLen = this.objs.length;
  
      // Iterate over all of the Sprites in the current room, invoking update on each on.
      for (;;) {
        if (a1) {
          a1.update();
  
          // Check if the Sprite is touching another Sprite.
          for (j = i + 1; j < objsLen; j++) {
            a2 = this.objs[j];
            if (a2 && a1.touching(a2)) {
              // If it is touching, then invoke hit on both Sprites. They might take 
              // different actions in response to the hit.
              a1.hit(a2);
              a2.hit(a1);
            }
          }
          
          // Clears the Sprite's moved flag, which is only of use to the hit method.
          a1.moved = false;
        }
        
        if (++i < objsLen) {
          a1 = this.objs[i];
        } else {
          break;
        }
      }
    },

    /**
     * Adds the given points to the current score.
     */
    addToScore: function(points) {
      this.score += points;
      $.score.innerHTML = '' + this.score + ' of 150';
    },
    
    /**
     * Processes the current user interaction.
     */
    processCommand: function(e) {
      if (this.userInput && !this._gameOver) {
        this.command = $.Logic.process(this.verb, this.command, this.thing, e);
        if (e) e.stopPropagation();
        if (this.command == this.verb) {
          this.command = this.verb = 'Walk to';
        }
      }
    },
    
    /**
     * Adds actors to the game.
     */
    addActors: function(numOfActors) {
      // Initialise actors for each outside room.
      this.initActors();

      // Now random assign actors to a room.
      for (let i=0; i<numOfActors; i++) {
        // Reserve space for the actor, but don't create yet (lazy instantiation)
        this.actors[this.random(92)].push(null);
      }

      // No actors in starting rooms.
      this.actors[1] = [];
      this.actors[2] = [];
    },

    /**
     * Initialises the actors array.
     */
    initActors: function() {
      for (let a=0; a<=92; a++) {
        this.actors[a] = [];
      }
    },

    /**
     * Returns a random number from 1 to n inclusive. Deliberately uses same seed every run.
     * 
     * @param {*} n a random number from 1 to n inclusive.
     */
    random: function(n) {
      this.lastRandom = (this.lastRandom * 1664525 + 1013904223) & 0xFFFFFFFF;
      let num = (((this.lastRandom & 0xFFFF) % n) + 1);
      return num;
    },

    /**
     * Invoked when Ego is entering a room.  
     */
    newRoom: function() {
      // Remove the previous room's Objs from the screen.
      for (let i=0; i<this.objs.length; i++) {
        this.objs[i].remove();
      }
      this.objs = [];

      $.roomData = this.rooms[this.room - 1];
      
      let inHall = ($.roomData[0] & 0x01);
      let onDeck = !inHall;
      $.screenWrap.className = (onDeck? 'deck ' : 'hallway ') + 'side' + $.ego.nesw + ' ';

      // If we're on deck, open the doors so that when ego walks back into the hallway, they'll
      // start by being open and then will close.
      if (onDeck) {
        $.leftDoor.classList.add('open');
        $.rightDoor.classList.add('open');
      }

      // Update the hallway sign.
      let dirChar = "ΔΘΣΩ"[$.ego.nesw];
      $.direction[0].textContent = dirChar;
      $.direction[1].textContent = dirChar;
      $.level[0] = this.level;
      $.level[1] = this.level;

      // Add props
      for (let i=0; i<this.props.length; i++) {
        var prop = this.props[i];
        
        // Is this prop in the current room?
        if (prop[0] == this.room) {
          this.addPropToRoom(prop);
        }
      }
      
      // Add actors.
      if (this.room < 93) {
        for (let i=0; i<this.actors[this.room].length; i++) {
          let g = this.actors[this.room][i];
          if (g == null) {
            // One in three ghosts is a child ghost.
            //g = this.actors[this.room][i] = new Ghost((this.random(3) == 1? 35 : 48));
          }
          //g.add();
          //if (g.x == 0) {
          //  g.setPosition(this.random(880) + 20, 0, this.random(120) + 540);
          //}
          //this.objs.push(g);
        }
      }

      // Add event listeners for objects in the room.
      var screenObjs = $.screen.children;
      for (let i=0; i<screenObjs.length; i++) {
        this.addObjEventListeners(screenObjs[i]);
      }
      
      $.Game.fadeIn($.screenWrap);
      $.ego.show();
      $.Game.fadeIn($.ego.elem);
    },

    /**
     * Adds the given prop to the current room screen.
     */
    addPropToRoom: function(prop) {
      var obj;
      
      // We cache the obj when it isn't in the dom rather than recreate. It might remember it's state.
      obj = prop[7];
      
      if (!obj) {
        // Switch on the type of prop
        switch (prop[1]) {
          case 0: // Actor
            switch (prop[2]) {
              case 'reaper':
                obj = new Actor(prop[3], prop[4], 'black', 0.95, 10, 'black');
                obj.setDirection(Sprite.LEFT);
                obj.ignore = true;
                break;
            }
            obj.setPosition(prop[5], 0, prop[6]);
            break;
            
          case 1: // Item
            obj = new Obj(prop[3], prop[4], prop[8]);
            obj.item = true;
            break;
            
          case 2: // Prop
            obj = new Obj(prop[3], prop[4], prop[8]);
            break;
        }

        // If the id has a _ then use parts of id to add class names.
        if (prop[2].indexOf('_') > -1) {
          let parts = prop[2].split('_');
          for (let i=0; i<parts.length; i++) {
            obj.elem.classList.add(parts[i]);
          }
        }

        $[prop[2]] = obj;
        obj.elem.id = prop[2];
        obj.propData = prop;
        obj.add();
        obj.setPosition(prop[5], 0, prop[6]);
        prop[7] = obj;
      }
      else {
        obj.add();
      }
      
      this.objs.push(obj);
    },
    
    /**
     * Adds the necessarily event listens to the given element to allow it to be 
     * interacted with as an object in the current room.
     */
    addObjEventListeners: function(elem) {
      // It is important that we don't use addEventListener in this case. We need to overwrite
      // the event handler on entering each room.
      elem.onmouseenter = function(e) {
        $.Game.thing = (e.target.dataset.name? e.target.dataset.name : (e.target.id? e.target.id.replace('_',' ') : e.target.className));
      };
      elem.onmouseleave = function(e) {
        $.Game.thing = '';
      };
      elem.onclick = function(e) {
        $.Game.thing = (e.target.dataset.name? e.target.dataset.name : (e.target.id? e.target.id.replace('_',' ') : e.target.className));
        $.Game.processCommand(e);
      };
    },
    
    /**
     * Adds the given item to the inventory.
     */
    getItem: function(name) {
      var item = document.createElement('div');
      item.innerHTML = name;
      $.items.appendChild(item);
      
      item.addEventListener("mouseenter", function(e) {
        $.Game.thing = name;
      });
      item.addEventListener("mouseleave", function(e) {
        $.Game.thing = '';
      });
      item.addEventListener("click", function(e) {
        $.Game.thing = name;
        $.Game.processCommand(e);
      });
      
      this.inventory[name] = item;
    },
    
    /**
     * Checks if the given item is in the inventory.
     */
    hasItem: function(name) {
      return this.inventory.hasOwnProperty(name);
    },
    
    /**
     * Removes the given item from the inventory.
     */
    dropItem: function(name) {
      var item = this.inventory[name];
      $.items.removeChild(item);
      delete this.inventory[name];
    },
    
    /**
     * Handles scrolling of the inventory list.
     */
    scrollInv: function(dir) {
      var newTop = this.itemTop + (27 * dir);
      var invCount = $.items.children.length;
      if ((newTop <= -1) && (newTop > -((invCount - 4) * 27))) {
        this.itemTop = newTop;
        $.items.style.top = this.itemTop + 'px';
      }
    },

    /**
     * Render a random star field and returns the created canvas.
     */
    renderStarField: function() {
      let STAR_COLOURS = ["#ffffff", "#ffe9c4", "#d4fbff"];
      let random = new $.Util.random(1234);

      // Render the base colour over the whole area first.
      let ctx = $.Util.create2dContext(960, 627);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 960, 627);
      
      for (let i = 0; i < 3000; i++) {
        let x = Math.random() * 960;
        let y = Math.random() * 627;
        let radius = Math.random() * 1.1;
        ctx.beginPath();
        ctx.globalAlpha = random(80, 100) / 100;
        ctx.fillStyle = STAR_COLOURS[random(0, 3)];
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
      }

      return ctx.canvas;
    },

    /**
     * Renders the grass canvas. It does this by randomly setting the luminousity of 
     * each pixel so that it looks like blades of grass from a distance.
     */
    renderWall: function() {
      // Render the base colour over the whole grass area first.
      var ctx = $.Util.create2dContext(960, 260);
      ctx.fillStyle = 'hsl(0, 0%, 10%)';
      ctx.fillRect(0, 0, 960, 260);
      
      // Now randomaly adjust the luminosity of each pixel.
      var imgData = ctx.getImageData(0, 0, 960, 260);
      for (var i=0; i<imgData.data.length; i+=4) {
        var texture = (Math.random() * 0.5);
        if (texture < 0.1) {
          texture = 1.0 - texture;
          imgData.data[i]=Math.floor(imgData.data[i] * texture);
          imgData.data[i+1]=Math.floor(imgData.data[i+1] * texture);
          imgData.data[i+2]=Math.floor(imgData.data[i+2] * texture);
          imgData.data[i+3]=200;
        } else {
          texture = 0.5 + texture;
          imgData.data[i]=Math.floor(imgData.data[i] / texture);
          imgData.data[i+1]=Math.floor(imgData.data[i+1] / texture);
          imgData.data[i+2]=Math.floor(imgData.data[i+2] / texture);
        }
      }
      
      ctx.putImageData(imgData,0,0);
      return ctx.canvas;
    },
    
    /**
     * Fades in the given DOM Element.
     * 
     * @param {Object} elem The DOM Element to fade in.
     */
    fadeIn: function(elem) {
      // Remove any previous transition.
      elem.style.transition = 'opacity 0.5s';
      elem.style.opacity = 1.0;
    },
    
    /**
     * Fades out the given DOM Element.
     * 
     * @param {Object} elem The DOM Element to fade out.
     */
    fadeOut: function(elem) {
      elem.style.transition = 'opacity 0.5s';
      elem.style.opacity = 0.0;
    },

    /**
     * Shakes the screen.
     */
    shakeScreen: function() {
      $.screen.classList.add('shake');
      setTimeout(function() {
        $.screen.classList.remove('shake');
      }, 1000);
    }

  };
  
  // On load, the game will start.
  window.onload = function() { 
    $.Game.start();
  };