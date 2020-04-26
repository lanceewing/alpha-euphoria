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
          case 'pod':
            $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
              $.ego.say("It won't budge.", 230);
            });
            break;

          default:
            $.ego.say("I can't push that.", 230);
            break;
        }
        break;
    
      case 'Walk to':
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
        switch (thing) {

          case 'left corridor':
          case 'right corridor':
            $.ego.say("The corridor makes a 90 degree turn around the corner.", 250);
            break;

          case 'light':
            $.ego.say("The lights illuminate the room.", 250);
            break;

          case 'door':
            $.ego.say("It is an automatic door.", 250);
            break;

          case 'pod':
            $.ego.say("It's a cryosleep chamber containg one of my crew members.", 300, function() {
              if (e.target.classList.contains('open')) {
                $.ego.say("Some fool has opened the door already.", 250);
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
              if (e.target.classList.contains('open')) {
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
                case 'door':
                  $.ego.moveTo($.activeDoor.offsetLeft + ($.activeDoor.offsetWidth / 2), $.ego.z, function() {
                    if ($.roomData[9] || $.inside) {
                      $.ego.say("I don't want to lock it again.", 220);
                    } else {
                      let keyRooms = {'green key': 41, 'black key': 40};
                      if (keyRooms[thing2] == $.Game.room) {
                        if ((thing2 == 'black key') && ($.Game.year == 2030)) {
                          $.ego.say("It's the right key, but someone has recently damaged the lock. The key won't go in.", 370);
                        } else {
                          // The key is for this door.
                          $.roomData[9] = true;
                          $.ego.say("The door is now unlocked.", 220);
                          $.Game.addToScore(15);
                        }
                      } else {
                        $.ego.say("It's the wrong key for this door.", 220);
                      }
                    }
                  });
                  break;

                default:
                  $.ego.say("Nothing happened.", 220);
                  break;
              }
            } else {
              $.ego.say("I don't have the " + thing2, 220);
            }

          } else {
            if (thing2 == 'touch of death') {
              switch (thing) {
                case 'me':
                  $.ego.say("It doesn't work on me.", 200);
                  break;

                case 'reaper':
                  $.ego.say("Strange... It doesn't work on him.", 200);
                  break;

                case 'ghost':
                  $.ego.say("They're already dead.", 200);
                  break;
                
                default:
                  $.ego.say("Nothing happened.", 220);
                  break;
              }
            }
            else if (thing2 == 'time machine') {
              switch (thing) {
                case 'light beam':
                  $.ego.moveTo(e.target.offsetLeft + (e.target.offsetWidth / 2), $.ego.z, function() {
                    $.ego.say("The time machine is charging...", 220, function() {
                      $.Game.addToScore(15);
                      $.ego.elem.style.opacity = 0.5;
                      $.ego.say("Hey! Wait! What is it doing to me?.", 220, function() {
                        $.Game.fadeOut($.ego.elem);
                        setTimeout(function() {
                          $.Game.initActors();
                          $.ego.year = 2025;
                          $.Game.userInput = true;
                        }, 500);
                      });
                    });
                  });
                  break;

                case 'mist':
                  $.ego.say("There isn't enough light coming through the mist.", 300);
                  break;
                
                default:
                  $.ego.say("Nothing happened.", 220);
                  break;
              }
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
