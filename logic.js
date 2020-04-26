/**
 * Holds room logic functions.
 */
$.Logic = {

  process: function(verb, cmd, thing, e) {
    let newCommand = cmd;
    let thingId = thing.replace(' ','_');

    switch (verb) {
      case 'Pull':
        switch (thing) {
          case 'pod':
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              $.ego.say("It won't budge.", 230);
            });
            break;

          default:
            $.ego.say("I can't pull that.", 230);
            break;
        }
        break;

      case 'Push':
        switch (thing) {
          case 'pod remote':
            if (!$.Game.flags.gasLeakFixed || !$.Game.flags.powerFixed) {
              $.ego.say("It is too unsafe to wake my crew members.", 250, function() {
                $.ego.say("I need to fix the gas leak on level 4, and the power failure on level 2.", 350);
              });
            } else {
              let pods = document.querySelectorAll('.pod');
              for (let i=0; i<pods.length; i++) {
                let pod = pods[i];
                if (pod) {
                  pod.classList.add('open');
                }
              }
              $.ego.say('The pods are opening...', 250, function() {
                $.Game.userInput = false;
                setTimeout(function() {
                  $.ego.elem.style.opacity = 0.0;
                  for (let i=0; i<$.Game.objs.length; i++) {
                    $.Game.objs[i].remove();
                  }
                  $.Game.objs = [];
                  $.wrap.style.cursor = 'crosshair';
                  $.Game.fadeOut($.wrap);
                  $.Game.gameOver("You've Won!!");
                }, 3000);
              });
            }
            break;

          case 'pod':
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              $.ego.say("It won't budge.", 230);
            });
            break;

          case 'button':
            if ($.Game.room == 27) {
              if ($.Game.flags.gasLeakFixed) {
                $.ego.say("I have already vented the gas.", 230);
              } else {
                $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
                  $.ego.say("I hear a sucking noise....", 250, function () {
                    $.Game.flags.gasLeakFixed = true;
                    let audio = new SpeechSynthesisUtterance('Venting gas from level 4');
                    var voices = window.speechSynthesis.getVoices();
                    audio.voice = voices.filter(function(voice) { return voice.name.includes('Zira'); })[0];
                    audio.pitch = 1;
                    audio.rate = 1;
                    audio.volume = 0.5;
                    window.speechSynthesis.speak(audio);
                    $.Game.addToScore(15);
                    $.Game.userInput = true;
                  });
                });
              }
            } else if ($.Game.room == 35) {
              if ($.Game.flags.powerFixed) {
                $.ego.say("I have already restored power.", 230);
              } else {
                $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
                  $.ego.say("I hear a humming noise....", 250, function () {
                    $.Game.flags.powerFixed = true;
                    let audio = new SpeechSynthesisUtterance('Power restored to level 2');
                    var voices = window.speechSynthesis.getVoices();
                    audio.voice = voices.filter(function(voice) { return voice.name.includes('Zira'); })[0];
                    audio.pitch = 1;
                    audio.rate = 1;
                    audio.volume = 0.5;
                    window.speechSynthesis.speak(audio);
                    $.Game.addToScore(15);
                    $.Game.userInput = true;
                    $.Game.fadeOut($.mist);
                    //$.mist.style.display = none;
                  });
                });
              }
            }
            break;

          default:
            $.ego.say("I can't push that.", 230);
            break;
        }
        break;
    
      case 'Walk to':
        if (($.Game.level == 2) && (!$.Game.flags.powerFixed) && (thing != 'elevator')) {
          // Death by darkness
          $.Game.userInput = false;
          $.ego.moveTo($.ego.x - 100, $.ego.z, function() {
            $.ego.say("Ahhh! I'm tripping in the darkness!", 250, function() {
              $.Game.userInput = false;
              $.ego.elem.classList.add('death');
              setTimeout(function() {
                $.ego.elem.style.opacity = 0.0;
                for (let i=0; i<$.Game.objs.length; i++) {
                  $.Game.objs[i].remove();
                }
                $.Game.objs = [];
                $.wrap.style.cursor = 'crosshair';
                $.Game.fadeOut($.wrap);
                $.Game.gameOver("You died!!");
              }, 3000);
            })
          });
          break;
        }
        switch (thing) {
          case 'door':
            $.Game.userInput = false;
            $.ego.stop();
            // Walk to be in front of the door
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              if (e.target.classList.contains('lower')) {
                // Lower door, which has no animation.
  
              } else {
                // Normal sliding door.
                e.target.classList.add('open');
                $.Sound.play('door');
              }
            });

            // Now walk through the door.
            $.ego.moveTo(
              e.target.offsetLeft + (e.target.offsetWidth / 2), 
              (e.target.classList.contains('lower')? 1000 : 480));
            break;

          case 'elevator':
            $.Game.userInput = false;
            $.Game.ignoreHorizon = true;
            $.ego.stop(true);
            // Walk to be in front of the elevator.
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              $.Sound.play('ting');
              e.target.classList.add('open');
            });
            // Now walk through the elevator door.
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), 510, function() {
              $.screenWrap.style.opacity = 0.5;
              $.elevatorPanel.style.display = 'block';
            });
            break;

          case 'left corridor':
            $.Game.userInput = false;
            $.ego.stop();
            // Walk to be in front of the corridor.
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z);
            // Now walk through the corridor.
            $.ego.moveTo(e.target.offsetLeft - 50, 1000);
            break;

          case 'right corridor':
            $.Game.userInput = false;
            $.ego.stop();
            // Walk to be in front of the corridor.
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z);
            // Now walk through the corridor.
            $.ego.moveTo(e.target.offsetLeft + e.target.offsetWidth + 50, 1000);
            break;
            
          default:
            $.ego.stop(true);
            var z = ((e.pageY / $.scaleY) - 27) * 2;
            if (z > 530) {
              $.ego.moveTo($.screenLeft + (e.pageX / $.scaleX), ((e.pageY / $.scaleY) - 27) * 2);
            } else {
              $.ego.moveTo($.screenLeft + (e.pageX / $.scaleX), 600);
            }
            break;
        }
        break;
    
      case 'Look at':
        if (($.Game.level == 2) && (!$.Game.flags.powerFixed)) {
          $.ego.say("This is dangerous. I can't see anything.", 250);
          break;
        }
        switch (thing) {
          case 'button':
            if ($.Game.room == 35) {
              $.ego.say("The button says \"Power restoration\".", 300);
            } else if ($.Game.room == 27) {
              $.ego.say("The button says \"Vent gas\".", 300);
            }
            break;

          case 'left corridor':
          case 'right corridor':
            $.ego.say("The corridor makes a 90 degree turn around the corner.", 250);
            break;

          case 'light':
            $.ego.say("The lights illuminate the room.", 250);
            break;

          case 'green key':
            $.ego.say("I wonder what this key opens.", 250);
            break;

          case 'door':
            $.ego.say("It is an automatic door.", 250);
            break;

          case 'note':
            $.ego.say("It's a maintence mission briefing:", 200, function() {
              $.ego.say("\"Alpha Euphoria has sustained damage due to asteroid collision\".", 300, function() {
                $.ego.say("\"Fix the gas leak on level 4 and power failure on level 2\".", 300, function() {
                  $.ego.say("\"It will then be safe to wake your crew mates\".", 250);
                });
              });
            });
            break;

          case 'pod remote':
            $.ego.say("It's a remote control for safely opening all the cryosleep pods.", 300);
            break;

          case 'pod':
            $.ego.say("It's a cryosleep chamber containg one of my crew members.", 300, function() {
              if (e.target.classList.contains('open')) {
                $.ego.say("Some fool has manually opened the door.", 250, function() {
                  $.ego.say("I guess this guy will die now.", 250);
                });
              } else {
                $.Game.userInput = true;
              }
            });
            break;

          case 'window':
            $.ego.say("Out the window, I see the vastness of space.", 250, function() {
              if ($.screenWrap.classList.contains('side1')) {
                $.ego.say("Nearby I can see the planet of Euphoria, our soon to be new home.", 300);
              } else {
                $.Game.userInput = true;
              }
            });
            break;

          case 'floor':
            if (($.Game.level != 4) || ($.Game.flags.gasLeakFixed)) {
              if ($.screenWrap.classList.contains('deck')) {
                $.ego.say("The floor is a shiny bluish colour.", 250);
              } else {
                $.ego.say("It is covered in red carpet.", 250);
              }
            } else {
              $.ego.say("A poisonous gas fills the room.", 250);
            }
            break;
            
          case 'me':
            $.ego.say("I'm Pip Wilco, the Alpha Euphoria maintenance engineer.", 250, function() {
              if ($.ego.elem.classList.contains('mask')) {
                $.ego.say("I'm wearing a breathing mask.", 250);
              } else {
                $.Game.userInput = true;
              }
            });
            break;

          case 'sign':
            $.ego.say("The sign says '" + 
                ["Delta", "Theta", "Sigma", "Omega"][$.ego.nesw] + " side, level " + 
                ['One', 'Two', 'Three', 'Four', 'Five', 'Six'][$.Game.level - 1] +
                "'", 250);
            break;

          case 'breathing mask':
            $.ego.say("Standard issue breathing mask with built in air canister.", 250);
            break;
            
          default:
            if (thing != "") {
              $.ego.say("It's just a " + thing + ".", 190);
            }
            break;
        
        }
        break;
      
      case 'Eat':
        switch (thing) {
          default:
            $.ego.say("Uh...  No.", 130);
            break;
        }
        break;
        
      case 'Talk to':
        switch (thing) {          
          case 'me':
            $.ego.say("Isn't that what I'm doing?", 150);
            break;

          case 'pod':
            $.ego.say("They are in cryosleep, so can't talk back.", 250);
            break;
            
          default:
            $.ego.say("There was no reply.", 220);
            break;
        }
        break;
    
      case 'Open':
        switch (thing) {
          case 'cupboard':
            // Walk to be in front of the cupboard
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              if (!$.Game.flags.cupboardUnlocked) {
                $.ego.say("The cupboard is locked.", 230);
              } else if (e.target.classList.contains('open')) {
                $.ego.say("The cupboard is already open.", 230);
              } else {
                e.target.classList.add('open');
              }
            });
            break;

          case 'elevator':
            $.ego.say("Try walking there.", 230);
            break;

          case 'pod':
            if (!$.Game.flags.podWarning) {
              $.ego.say("Are you sure? I think that is too dangerous at present.", 250);
              $.Game.flags.podWarning = true;
            } else {
              // Walk to be in front of the pod
              $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
                if (e.target.classList.contains('open')) {
                  $.ego.say("The pod is already open.", 230);
                } else {
                  e.target.classList.add('open');
                }
              });
            }
            break;
            
          case 'door':
            $.ego.say("Try walking there.", 230);
            break;

          case 'window':
            $.ego.say("It doesn't open.", 230, function() {
              $.ego.say("Even if it did, I don't think that would be wise.", 300);
            });
            break;
            
          default:
            $.ego.say("It doesn't open.", 230);
            break;
        }
        break;
        
      case 'Close':
        switch (thing) {
          case 'cupboard':
            // Walk to be in front of the cupboard
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              if (!e.target.classList.contains('open')) {
                $.ego.say("The cupboard is already closed.", 230);
              } else {
                e.target.classList.remove('open');
              }
            });
            break;

          case 'pod':
            // Walk to be in front of the pod
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              if (!e.target.classList.contains('open')) {
                $.ego.say("The pod is already closed.", 230);
              } else {
                e.target.classList.remove('open');
              }
            });
            break;

          case 'door':
            $.ego.say("It's an automatic door.", 220);
            break;
            
          default:
            $.ego.say("It doesn't close.", 220);
            break;
        }
        break;
        
      case 'Use':
        if (cmd == verb) {
          newCommand = 'Use ' + thing + ' with ';
        } else {
          let thing2 = cmd.substring(4, cmd.indexOf(' with '));
          
          if (thing2.indexOf(' key') > -1) {
            if ($.Game.hasItem(thing2)) {
              // Using a key.
              switch (thing) {
                case 'cupboard':
                  // Walk to be in front of the cupboard
                  $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
                    if (!$.Game.flags.cupboardUnlocked) {
                      $.ego.say("The cupboard is now unlocked.", 230);
                      $.Game.addToScore(15);
                      $.Game.flags.cupboardUnlocked = true;

                    } else {
                      $.ego.say("The cupboard is already unlocked.", 230);
                    }
                  });
                  break;

                case 'pod':
                  $.ego.say("The cryosleep pod does not have a key hole.", 250);
                  break;

                default:
                  $.ego.say("Nothing happened.", 220);
                  break;
              }
            } else {
              $.ego.say("I don't have the " + thing2, 220);
            }

          } else {
            if (thing2 == 'pod remote') {
              switch (thing) {
                case 'pod':
                  if (!$.Game.flags.gasLeakFixed || !$.Game.flags.powerFixed) {
                    $.ego.say("It is too unsafe to wake my crew members.", 250, function() {
                      $.ego.say("I need to fix the gas leak on level 4, and the power failure on level 2.", 350);
                    });
                  } else {
                    let pods = document.querySelectorAll('.pod');
                    for (let i=0; i<pods.length; i++) {
                      let pod = pods[i];
                      if (pod) {
                        pod.classList.add('open');
                      }
                    }
                    $.ego.say('The pods are opening...', 250, function() {
                      $.Game.userInput = false;
                      setTimeout(function() {
                        $.ego.elem.style.opacity = 0.0;
                        for (let i=0; i<$.Game.objs.length; i++) {
                          $.Game.objs[i].remove();
                        }
                        $.Game.objs = [];
                        $.wrap.style.cursor = 'crosshair';
                        $.Game.fadeOut($.wrap);
                        $.Game.gameOver("You've Won!!");
                      }, 3000);
                    });
                  }
                  break;
                
                default:
                  $.ego.say("Nothing happened.", 220);
                  break;
              }
            }
            if (thing2 == 'breathing mask') {
              $.ego.say("Nothing happened.", 220);
            }
            if (thing2 == 'note') {
              $.ego.say("Nothing happened.", 220);
            }
          }

          newCommand = verb;
        }
        break;
        
      case 'Give':
        if (cmd == verb) {
          newCommand = 'Give ' + thing + ' to ';
        } else {
          switch (cmd + thing) {
              
            default:
              if (thing == 'me') {
                $.ego.say("You lost me at 'Give'", 260);
              } else {
                $.ego.say("I think it said no.", 230);
              }
              break;
          }
          
          newCommand = verb;
        }
        break;

      case 'Put on':
        switch (thing) {
          case 'breathing mask':
            if ($.Game.hasItem('breathing mask')) {
              if ($.ego.elem.classList.contains('mask')) {
                $.ego.say("I'm already wearing it.", 230);
              } else {
                if (!$.Game.flags.putOnMask) {
                  $.Game.addToScore(15);
                  $.Game.flags.putOnMask = true;
                }
                $.ego.elem.classList.add('mask');
              }
            } else {
              $.ego.say("Maybe I should pick it up first.", 230);
            }
            break;
            
          default:
            $.ego.say("I can't wear that.", 230);
            break;
        }
        break;

      case 'Take off':
        switch (thing) {
          case 'breathing mask':
            if ($.Game.hasItem('breathing mask')) {
              if ($.ego.elem.classList.contains('mask')) {
                $.ego.elem.classList.remove('mask');
              } else {
                $.ego.say("I'm not wearing the mask.", 230);
              }
            } else {
              $.ego.say("I don't have the mask yet.", 230);
            }
            break;

          default:
            $.ego.say("I'm not wearing that.", 230);
            break;
        }
        break;
        
      case 'Pick up':
        if ($.Game.hasItem(thing)) {
          $.ego.say("I already have that.", 140);
        } else {
          switch (thing) {
            default:
              // Is item in the current room?
              if ($[thingId] && $[thingId].item) {
                $.ego.moveTo($.ego.cx, 600, function() {
                  $.ego.moveTo($[thingId].x, 600, function() {
                    $.Game.getItem(thing);
                    $[thingId].remove();
                    $[thingId].propData[0] = 0;  // Clears the room number for the item.
                    $.Game.addToScore(15);
                  });
                });
              }
              else {
                $.ego.say("I can't get that.", 220);
              }
              break;
          
          }
        }
        break;

      default:
        $.ego.say("Nothing happened.", 220);
        break;
    }
    
    return newCommand;
  }
};
