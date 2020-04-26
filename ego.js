class Ego extends Actor {

    /**
     * Creates a new Ego. This is the main character whom the player controls. The
     * name originates with the old Sierra On-Line 3D animated adventure games. There
     * should be only one instance of this class.
     */
    constructor() {
        super(50, 150, 'grey', 0.95, 5, 'white', 'grey', 'red');
        this.elem.classList.add('ego');
        this.elem.id = 'me';
        this.nesw = 1;
        this.setDirection(Sprite.OUT);

        let wearing = document.createElement('span');
        wearing.className = 'wearing';
        wearing.innerHTML = '';
        
        // let left;
        // if (this.x > 800) {
        //   left = -width + 40;
        // } else if (this.x < 100) {
        //   left = -10;
        // } else {
        //   left = -(width / 2);
        // }
        
        //bubble.style.width = width + 'px';
        //bubble.style.left = left + 'px';
        
        let elem = this.elem;
        elem.appendChild(wearing);
    }
  
    /**
     * Invoked by the move method when Ego has hit an edge. If the edge is the ground, then the
     * edge parameter is undefined. If the edge is one of the four directions, then Ego is 
     * attempting to exit the current room. 
     *  
     * @param {Array} edge If defined, it will be an array that represents the edge that was hit.
     */
    hitEdge(edge) {
        if (edge) {
            // Stop moving.
            this.destX = this.destZ = -1;
            this.heading = null;
            this.cell = 0;
            
            // Now check if there is a room on this edge.
            if (edge < 10) {
                // Edge config starts at position 3 in room data.
                let edgeData = $.Game.rooms[this.room - 1][2 + edge]; 
                if (edgeData) {
                    $.Game.userInput = false;
                    
                    // Hide ego before we reposition him to the new entry point.
                    this.hide();
                    
                    // Set the new room for ego.
                    this.room = edgeData;
                    
                    // Work out the new position for ego.
                    switch (edge) {
                        case 1: // Left edge.
                            this.setPosition(1920 + this.width, this.y, 600);
                            this.setDirection(Sprite.LEFT);
                            this.moveTo(1920 - this.width - 50, 600, function() {
                                $.Game.userInput = true;
                            });
                            break;

                        case 2: // Hit left path, so come in from right path.
                            this.setPosition(1970, this.y, 740);
                            this.setDirection(Sprite.IN);
                            this.moveTo(1870, 600, function() {
                                $.Game.userInput = true;
                            });
                            this.nesw = ((this.nesw + 1) & 0x03);
                            break;

                        case 3: // Hit left door up.
                            this.setPosition(this.x, this.y, 740);
                            this.setDirection(Sprite.IN);
                            this.moveTo(this.x, 600, function() {
                                $.Game.userInput = true;
                            });
                            break;

                        case 4: // Hit right door up.
                            this.setPosition(this.x, this.y, 740);
                            this.setDirection(Sprite.IN);
                            this.moveTo(this.x, 600, function() {
                                $.Game.userInput = true;
                            });
                            break;

                        case 5: // Hit right path, so come in from left path.
                            this.setPosition(-50, this.y, 740);
                            this.setDirection(Sprite.IN);
                            this.moveTo(50, 600, function() {
                                $.Game.userInput = true;
                            });
                            this.nesw = ((this.nesw - 1) & 0x03);
                            break;

                        case 6: // Right edge.
                            this.setPosition(0 - this.width * 2, this.y, 600);
                            this.setDirection(Sprite.RIGHT);
                            this.moveTo(this.width + 50, 600, function() {
                                $.Game.userInput = true;
                            });
                            break;

                        case 7: // Right door down.
                            this.setPosition(this.x, this.y, 500);
                            this.setDirection(Sprite.OUT);
                            this.moveTo(this.x, 600, function() {
                                $.Game.userInput = true;
                                $.leftDoor.classList.remove('open');
                                $.rightDoor.classList.remove('open');
                            });
                            break;

                        case 8: // Left door down.
                            this.setPosition(this.x, this.y, 500);
                            this.setDirection(Sprite.OUT);
                            this.moveTo(this.x, 600, function() {
                                $.Game.userInput = true;
                                $.leftDoor.classList.remove('open');
                                $.rightDoor.classList.remove('open');
                            });
                            break;
                    }
                    
                    this.step = 1;
                }
            }
        }
    }
}