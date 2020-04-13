(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.OPL3 = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
var extend = _dereq_('extend');

// Things that the Player class expects from a format:
// 
// * load() function
// * update() function
// * refresh() function
// * rewind() function
// * position property
// * data property
// * opl property

function ROL(opl, options) {
    options = options || {};

    this.opl = opl;

    this.totalNoteTicks = 0;
    this.currentTimeInTicks = 0;
    this.timeToNextUpdate = 0;

    this.tempoEvents = [];
    this.noteEvents = [];
    this.volumeEvents = [];
    this.instrumentEvents = [];
    this.pitchEvents = [];
    this.currentInstrument = [];

    // Set up array for storing the currently active event index for each
    // event type for each voice.
    this.currentEventIndex = [];
    for (var eventType=0; eventType<4; eventType++) {
        this.currentEventIndex[eventType] = [];
        for (var voice=0; voice<11; voice++) {
            this.currentEventIndex[eventType][voice] = 0;
        }
    }

    // Decode and apply instruments from options.instruments, which will be a .BNK file.
    if (options.instruments) {
        this.decodeInstruments(options.instruments);
    }

    this.init();
}

module.exports = ROL;

extend(ROL.prototype, {

    /**
     * Initialises the ROL player.
     */
    init: function() {
        this.oplWriteInitState();
    },

    decodeInstruments: function(instruments) {
        this.bankData = new DataView(instruments);

        // Header section.
        /* 0x00: */ this.bankMajorVersion = this.bankData.getUint8(0x00, true);
        /* 0x01: */ this.bankMinorVersion = this.bankData.getUint8(0x01, true);
        /* 0x02: Signature. "ADLIB-" */
        /* 0x08: */ this.numInstrumentsUsed = this.bankData.getUint16(0x08, true);
        /* 0x0A: */ this.numInstruments = this.bankData.getUint16(0x0A, true);
        /* 0x0C: */ this.instrumentNamesOffset = this.bankData.getUint32(0x0C, true);
        /* 0x10: */ this.instrumentDataOffset = this.bankData.getUint32(0x10, true);
        /* 0x14: 8 bytes of 0x00 padding. */

        // Offset is 0x1C at the point that we start loading instruments.
        var offset = 0x1C;

        // Instruments keyed by name.
        this.instruments = {};

        // Read in the definitions of every instrument.
        for (var insNum=0; insNum<this.numInstruments; insNum++) {
            var instrument = [];
            var instrumentIndex = this.bankData.getUint16(offset, true);
            offset += 2;
            var usedFlag = this.bankData.getUint8(offset, true);
            offset ++;
            var instrumentOffset = this.instrumentDataOffset + (instrumentIndex * 0x1E);
            var instrumentName = this.loadString(offset, this.bankData);
            offset += 9;

            // Not sure that we need these two.
            var percussive = this.bankData.getUint8(instrumentOffset++);
            var voiceNum = this.bankData.getUint8(instrumentOffset++);
            
            // Modulator operator.
            var keyScalingLevel = this.bankData.getUint8(instrumentOffset++);
            var frequencyMultiplier = this.bankData.getUint8(instrumentOffset++);
            var feedback = this.bankData.getUint8(instrumentOffset++);
            var attack = this.bankData.getUint8(instrumentOffset++);
            var sustain = this.bankData.getUint8(instrumentOffset++);
            var egType = this.bankData.getUint8(instrumentOffset++);
            var decay = this.bankData.getUint8(instrumentOffset++);
            var release = this.bankData.getUint8(instrumentOffset++);
            var totalLevel = this.bankData.getUint8(instrumentOffset++);
            var amplitudeVibrato = this.bankData.getUint8(instrumentOffset++);
            var frequencyVibrato = this.bankData.getUint8(instrumentOffset++);
            var keyScalingRate = this.bankData.getUint8(instrumentOffset++);
            var connection = this.bankData.getUint8(instrumentOffset++);

            instrument[0] = (frequencyMultiplier & 0x0F) | ((keyScalingRate << 4) & 0x10) | ((egType << 5) & 0x20) | ((frequencyVibrato << 6) & 0x40) | ((amplitudeVibrato << 7) & 0x80);
            instrument[2] = (totalLevel & 0x3F) | ((keyScalingLevel << 6) & 0xC0);
            instrument[4] = ((attack << 4) & 0xF0) | (decay & 0x0F);
            instrument[6] = ((sustain << 4) & 0xF0) | (release & 0x0F);
            instrument[10] = ((feedback << 1) & 0x0E) | ((connection ^ 0x01) & 0x01);

            // Carrier operator.
            keyScalingLevel = this.bankData.getUint8(instrumentOffset++);
            frequencyMultiplier = this.bankData.getUint8(instrumentOffset++);
            feedback = this.bankData.getUint8(instrumentOffset++);
            attack = this.bankData.getUint8(instrumentOffset++);
            sustain = this.bankData.getUint8(instrumentOffset++);
            egType = this.bankData.getUint8(instrumentOffset++);
            decay = this.bankData.getUint8(instrumentOffset++);
            release = this.bankData.getUint8(instrumentOffset++);
            totalLevel = this.bankData.getUint8(instrumentOffset++);
            amplitudeVibrato = this.bankData.getUint8(instrumentOffset++);
            frequencyVibrato = this.bankData.getUint8(instrumentOffset++);
            keyScalingRate = this.bankData.getUint8(instrumentOffset++);
            connection = this.bankData.getUint8(instrumentOffset++);

            instrument[1] = (frequencyMultiplier & 0x0F) | ((keyScalingRate << 4) & 0x10) | ((egType << 5) & 0x20) | ((frequencyVibrato << 6) & 0x40) | ((amplitudeVibrato << 7) & 0x80);
            instrument[3] = (totalLevel & 0x3F) | ((keyScalingLevel << 6) & 0xC0);
            instrument[5] = ((attack << 4) & 0xF0) | (decay & 0x0F);
            instrument[7] = ((sustain << 4) & 0xF0) | (release & 0x0F);
            instrument[11] = ((feedback << 1) & 0x0E) | ((connection ^ 0x01) & 0x01);

            // Wave select.
            instrument[8] = this.bankData.getUint8(instrumentOffset++);
            instrument[9] = this.bankData.getUint8(instrumentOffset++);

            // Store instrument data by name.
            this.instruments[instrumentName] = instrument;

            // UINT8	ksl	Key scaling level	0x40 (bits 6-7)	
            // UINT8	multiple	Frequency multiplier	0x20 (bits 0-3)	iMultiple & 0x0F is sent to OPL register [verify this]
            // UINT8	feedback	Feedback [op 0 only, op 1 ignored]	0xC0 (bits 1-3)	
            // UINT8	attack	Attack rate	0x60 (upper four bits)	[verify this]
            // UINT8	sustain	Sustain level	0x80 (upper four bits)	[verify this]
            // UINT8	egType	Envelope gain (nonzero value is on)	0x20 (bit 5)	[verify this]
            // UINT8	decayRate	Decay rate	0x60 (lower four bits)	[verify this]
            // UINT8	releaseRate	Release rate	0x80 (lower four bits)	[verify this]
            // UINT8	totalLevel	Total output level	0x40 (bit 0-5)	[verify this]
            // UINT8	tremolo	Amplitude modulation (Tremolo)	0x20 (bit 7)	[verify this]
            // UINT8	vib	Frequency Vibrato	0x20 (bit 6)	[verify this]
            // UINT8	ksr	Key scaling/envelope rate	0x20 (bit 4)	[verify this]
            // UINT8	con	Connector [op 0 only, op 1 ignored]	0xC0 (bit 0, inverted)	0: OPL bit set to 1
            // other: OPL bit set to 0
        }
    },

    oplWriteReg: function(reg, data) {
        this.opl.write(0, reg, data);
    },

    oplWriteChannel: function(regbase, channel, data1, data2) {
        var reg = regbase + this.op_num[channel];
        this.oplWriteReg(reg, data1);
        this.oplWriteReg(reg + 3, data2);
    },

    oplWriteValue: function(regbase, channel, value) {
        this.oplWriteReg(regbase + channel, value);
    },

    oplConvertVolume: function(data, volume) {
        return 0x3f - (((0x3f - data) * this.volumetable[volume <= 127 ? volume : 127]) >> 7);
    },

    // This is taken from the MUS format class. Not sure if it is 100% valid for ROL.
    oplWriteVolume: function(channel, volumeMultiplier) {
        var instr = this.currentInstrument[channel];
        var volume = Math.round(volumeMultiplier * 0x7F);
        if (instr) {
            this.oplWriteChannel(0x40, channel, ((instr[10] & 1) ?
                this.oplConvertVolume(instr[2] & 0x3F, volume) : instr[2] & 0x3F) | instr[2] & 0xC0,
                this.oplConvertVolume(instr[3] & 0x3F, volume) | instr[3] & 0xC0);
        }
    },

    oplWriteInstrument: function(channel, instr) {
        // Sound Characteristic (REG 0x20-> AM/VIB/EG-TYPE/KSR/MULTIPLE)
        // Level                (REG 0x40-> KSL/TOTAL LEVEL)
        // AttackDecay          (REG 0x60-> ATTACK RATE/DECAY RATE)
        // SustainRelease       (REG 0x80-> SUSTAIN RATE/RELEASE RATE)
        // WaveSelect           (REG 0xE0-> WAVE SELECT)
        // Feedback/Selectivity (REG 0xC0-> FEEDBACK/CONNECTION)
        this.oplWriteChannel(0x20, channel, instr[0], instr[1]);
        this.oplWriteChannel(0x40, channel, instr[2], instr[3]);
        this.oplWriteChannel(0x60, channel, instr[4], instr[5]);
        this.oplWriteChannel(0x80, channel, instr[6], instr[7]);
        this.oplWriteChannel(0xe0, channel, instr[8], instr[9]);
        this.oplWriteValue(0xc0, channel, instr[10] | 0x30);
    },

    oplKeyOff: function(voice) {
        this.oplWriteReg(0xB0 + voice, 0);
    },

    oplPlayNote: function(voice, note, keyon) {
        keyon = (keyon === undefined? true : keyon);
        this.oplKeyOff(voice);
        var blockNum = Math.floor((note-19)/12);
        if (blockNum < 0) blockNum = 0;
        if (blockNum > 7) blockNum = 7;
        var frequency = Math.pow(2, ((note-69)/12)) * 440;
        var fNum = Math.round(frequency * Math.pow(2, (20-blockNum)) / 49716);
        var regNum = 0xA0 + voice;
        this.oplWriteReg(regNum, fNum & 0xff);
        regNum = 0xB0 + voice;
        var tmp = (fNum >> 8) | (blockNum << 2) | (keyon? 0x20 : 0x00);
        this.oplWriteReg(regNum, tmp);
    },

    oplReleaseNote: function(voice, note) {
        this.oplKeyOff(voice);
        if (note > 0) {
          this.oplPlayNote(voice, note, false);
        }
    },

    oplWriteInitState: function() {
        // The underlying OPL3 class supports both OPL3 and OPL2, so we turn off OPL3 as part of the init.
        this.opl.write(1, 0x105, 0x00);	    // disable YMF262/OPL3 mode, so runs in OPL2 mode.
        this.opl.write(1, 0x104, 0x00);	    // disable 4-operator mode
        this.oplWriteReg(0x01, 0x20);	    // enable Waveform Select
        this.oplWriteReg(0x08, 0x40);	    // turn off CSW mode
        this.oplWriteReg(0xbd, 0x00);	    // set vibrato/tremolo depth to low, set melodic mode
    },

    loadTempoEvents: function() {
        // 12      15      char    filler
        // 13      4       float   basic tempo
        // Field 14 indicates the number of times to repeat fields 15 and 16:
        // 14      2       int     number of tempo events
        // 15      2       int     time of events, in ticks
        // 16      4       float   tempo multiplier (0.01 - 10.0)

        // 0xB6: Tempo section start here
        /* 0xB6: 15 byte Tempo section name. Usually "Tempo" */
        this.offset += 15;
        /* 0xC5: */ this.basicTempo = this.data.getFloat32(this.offset, true);
        this.offset += 4;
        /* 0xC9: */ this.numOfTempoEvents = this.data.getUint16(this.offset, true);
        this.offset += 2;

        for (var i=0; i<this.numOfTempoEvents; i++) {
            var timeInTicks = this.data.getUint16(this.offset, true);
            this.offset += 2;
            var tempoMultiplier = this.data.getFloat32(this.offset, true);
            this.offset += 4;

            this.tempoEvents[i] = {
                timeInTicks: timeInTicks,
                tempoMultiplier: tempoMultiplier
            };
        }
    },

    loadString: function(offset, data) {
        var stringStart = offset
        var stringEnd = stringStart;

        // Find the end of the string (null terminated)
        while (data.getUint8(stringEnd++) != 0) ;

        // Convert the byte data between the string start and end in to an ASCII string.
        return String.fromCharCode.apply(null, (new Uint8Array(data.buffer.slice(stringStart, stringEnd - 1))));
    },

    loadNoteEvents: function(voice) {
        this.noteEvents[voice] = [];

        // 15 byte Track name, null terminated (usually "Voix ##", # - voice number from 0)
        this.offset += 15;
        var voiceTotalNoteTicks = this.data.getUint16(this.offset, true);
        this.offset += 2;

        var noteIndex = 0;
        var totalDuration = 0;

        // Repeat the next two fields (19 and 20) while the summation of field 20 is
        // less than the value of field 18:
        while (totalDuration < voiceTotalNoteTicks) {
            // 19      2       int     note number: 0 => silence
            //                         from 12 to 107 => normal note (you must
            //                         subtract 60 to obtain the correct value
            //                         for the sound driver)
            // Note number (0: note off, 12..107: note on)
            // The note value is compatible with MIDI standard (48 is middle-C).
            var noteNumber = this.data.getUint16(this.offset, true);
            this.offset += 2;
            // 20      2       int     note duration, in ticks
            var noteDuration = this.data.getUint16(this.offset, true);
            this.offset += 2;
            this.noteEvents[voice][noteIndex] = {
                timeInTicks: totalDuration,
                note: noteNumber,
                duration: noteDuration
            };
            totalDuration += noteDuration;
            noteIndex++;
        }

        // Note sure if this is the best way to work out the end of the song.
        if (voiceTotalNoteTicks > this.totalNoteTicks) {
            this.totalNoteTicks = voiceTotalNoteTicks;
        }
    },

    loadInstrumentEvents: function(voice) {
        // AKA. The Timbre track.
        this.instrumentEvents[voice] = [];

        // 15 byte Track name, null terminated (usually "Timbre ##", # - voice number from 0)
        this.offset += 15;
        this.numOfInstrumentEvents = this.data.getUint16(this.offset, true);
        this.offset += 2;

        // Field 22 indicates the number of times to repeat fields 23 to 26:
        // 22      2       int     number of instrument events
        for (var i=0; i<this.numOfInstrumentEvents; i++) {
            var timeInTicks = this.data.getUint16(this.offset, true);
            this.offset += 2;
            // 9 bytes, Instrument name, null terminated
            // Instrument name is a reference to INSTNAME.INS file, or an instrument name inside STANDARD.BNK file.
            var instrumentName = this.loadString(this.offset, this.data);
            this.offset += 9;
            // 1 byte, padding, set to zero.
            this.offset++;
            // 2 bytes, unknown/unused value. Sometimes equal to instrument index
            this.offset += 2;

            this.instrumentEvents[voice][i] = {
                timeInTicks: timeInTicks,
                instrumentName: instrumentName
            };
        }
    },

    loadVolumeEvents: function(voice) {
        this.volumeEvents[voice] = [];

        // 15 byte Track name, null terminated (usually "Volume ##", # - voice number from 0)
        this.offset += 15;
        this.numOfVolumeEvents = this.data.getUint16(this.offset, true);
        this.offset += 2;

        // Field 28 indicates the number of times to repeat fields 29 and 30:
        // 28      2       int     number of volume events
        for (var i=0; i<this.numOfVolumeEvents; i++) {
            var timeInTicks = this.data.getUint16(this.offset, true);
            this.offset += 2;
            var volumeMultiplier = this.data.getFloat32(this.offset, true);
            this.offset += 4;

            this.volumeEvents[voice][i] = {
                timeInTicks: timeInTicks,
                volumeMultiplier: volumeMultiplier
            };
        }
    },

    loadPitchEvents: function(voice) {
        this.pitchEvents[voice] = [];

        // 15 byte Track name, null terminated (usually "Pitch ##", # - voice number from 0)
        this.offset += 15;
        this.numOfPitchEvents = this.data.getUint16(this.offset, true);
        this.offset += 2;

        // Field 32 indicates the number of times to repeat fields 33 and 34:
        // 32      2       int     number of pitch events
        for (var i=0; i<this.numOfPitchEvents; i++) {
            var timeInTicks = this.data.getUint16(this.offset, true);
            this.offset += 2;
            // 34      4       float   pitch variation (0.0 - 2.0, nominal is 1.0)
            // Single	pitch	Pitch variation (in range 0.0 - 2.0)
            // These events works the same as Pitch Bend events. Nominal pitch value is 1.0.
            var pitchVariation = this.data.getFloat32(this.offset, true);
            this.offset += 4;

            this.pitchEvents[voice][i] = {
                timeInTicks: timeInTicks,
                pitchVariation: pitchVariation
            };
        }
    },

    load: function(buffer) {
        this.data = new DataView(buffer.buffer || buffer);

        // Header section.
        /* 0x00: */ this.majorVersion = this.data.getUint16(0, true);
        /* 0x02: */ this.minorVersion = this.data.getUint16(2, true);
        /* 0x04: ROL file type signature of 40 bytes at this point. We ignore. Usually "\roll\default" */
        /* 0x2C: */ this.ticksPerBeat = this.data.getUint16(44, true);
        /* 0x2E: */ this.beatsPerMeasure = this.data.getUint16(46, true);
        /* 0x30: */ this.scaleYAxis = this.data.getUint16(48, true);
        /* 0x32: */ this.scaleXAxis = this.data.getUint16(50, true);
        /* 0x34: 1 byte gap reserved for future use. Set to zero. */
        /* 0x35: */ this.musicMode = this.data.getUint8(53, true);  // 0 = percussive, 1 = melodic
        /* 0x36: Counter values for each track at this point. 90 bytes, being 45 * 2 (each is a UINT16LE) */
        /* 0x90: Filler/Padding of 38 bytes at this point, all set to zero. */

        // Offset is 0xB6 at the point that we start loading events.
        this.offset = 0xB6;

        // There is only one set of tempo events that applies to all voices.
        this.loadTempoEvents();

        // All other event types are repeats 11 times, i.e. once for each voice.
        for (var voice=0; voice<11; voice++) {
            this.loadNoteEvents(voice);
            this.loadInstrumentEvents(voice);
            this.loadVolumeEvents(voice);
            this.loadPitchEvents(voice);
        }

        this.position = 0;

        this.channels = [];

        for (var i = 0; i < this.OPL2CHANNELS; i++){
            this.channels[i] = {};
        }

    },

    // Updates the OPL2 chip with more settings from the song data.
    // Returns true if there is more of the song to play; otherwise false.
    update: function() {
        if (this.currentTimeInTicks >= this.totalNoteTicks) {
            return false;
        }

        // Last update was timeToNextUpdate ticks ago.
        this.currentTimeInTicks += this.timeToNextUpdate;

        // Set timeToNextUpdate to full length, then whilst scanning the events, this
        // number will be reduced until we have the true/actual timeToNextUpdate value.
        this.timeToNextUpdate = this.totalNoteTicks;

        // Update the 11 voices
        // Voice 5 (index 4) jazzguit first note sounds really distorted.
        // Voice 6 (index 5) strings: volume not low enough? piano: only one note, but volume changes are causing note to be played multiple times.
        var voice = 5;
        for (var voice=0; voice<11; voice++) {

            // Update the instrument events.
            var nextInstrumentIndex = this.currentEventIndex[2][voice];
            var nextInstrument = this.instrumentEvents[voice][nextInstrumentIndex];

            if (nextInstrument) {
                // Check if we need to change instrument for this voice.
                if (nextInstrument.timeInTicks <= this.currentTimeInTicks) {
                    // The last instrument has ended, so start the next note.
                    var instrumentName = nextInstrument.instrumentName.toUpperCase();
                    var instrumentDefinition = this.instruments[instrumentName];
                    if (instrumentDefinition) {
                        this.oplWriteInstrument(voice, instrumentDefinition);
                        this.currentInstrument[voice] = instrumentDefinition;
                    }

                    // Set up event index for the next instrument.
                    this.currentEventIndex[2][voice] = ++nextInstrumentIndex;
                    nextInstrument = this.instrumentEvents[voice][nextInstrumentIndex];
                }

                // Check if the next instrument's start tick is lower than the current timeToNextUpdate.
                if (nextInstrument && (nextInstrument.timeInTicks > this.currentTimeInTicks)) {
                    var timeToInstrument = nextInstrument.timeInTicks - this.currentTimeInTicks;
                    if (timeToInstrument < this.timeToNextUpdate) {
                        this.timeToNextUpdate = timeToInstrument;
                    }
                }
            }

            // Update the volume events.
            var nextVolumeIndex = this.currentEventIndex[1][voice];
            var nextVolume = this.volumeEvents[voice][nextVolumeIndex];

            if (nextVolume) {
                // Check if we need to change volume for this voice.
                if (nextVolume.timeInTicks <= this.currentTimeInTicks) {
                    // The last volume has ended, so start the next note.
                    this.oplWriteVolume(voice, nextVolume.volumeMultiplier);

                    // Set up event index for the next volume.
                    this.currentEventIndex[1][voice] = ++nextVolumeIndex;
                    nextVolume = this.volumeEvents[voice][nextVolumeIndex];
                }

                // Check if the next volume's start tick is lower than the current timeToNextUpdate.
                if (nextVolume && (nextVolume.timeInTicks > this.currentTimeInTicks)) {
                    var timeToVolume = nextVolume.timeInTicks - this.currentTimeInTicks;
                    if (timeToVolume < this.timeToNextUpdate) {
                        this.timeToNextUpdate = timeToVolume;
                    }
                }
            }

            // Update the Notes.
            var nextNoteIndex = this.currentEventIndex[0][voice];
            var nextNote = this.noteEvents[voice][nextNoteIndex];
            var currentNote = (nextNoteIndex > 0? this.noteEvents[voice][nextNoteIndex-1] : nextNote);

            if (nextNote) {
                // Check if we need to play a new note for this voice.
                if (nextNote.timeInTicks <= this.currentTimeInTicks) {
                    // The last note has ended, so play the next note.
                    if (nextNote.note > 0) {
                        this.oplPlayNote(voice, nextNote.note);
                    } else {
                        // We only play a note if it is greater than 0. Note 0 means OFF, i.e. release last note.
                        this.oplReleaseNote(voice, currentNote.note);
                    }

                    // Set up event index for the next note.
                    this.currentEventIndex[0][voice] = ++nextNoteIndex;
                    nextNote = this.noteEvents[voice][nextNoteIndex];
                }

                // Check if the next note's start tick is lower than the current timeToNextUpdate.
                if (nextNote && (nextNote.timeInTicks > this.currentTimeInTicks)) {
                    var timeToNote = nextNote.timeInTicks - this.currentTimeInTicks;
                    if (timeToNote < this.timeToNextUpdate) {
                        this.timeToNextUpdate = timeToNote;
                    }
                }
            }

            // TODO: Update the pitch events.

        }

        this.position = ((this.currentTimeInTicks / this.totalNoteTicks) * this.data.byteLength);

        return (this.timeToNextUpdate < this.totalNoteTicks);
    },

    // Returns the time in seconds to delay, or number of seconds to generate samples for before calling update again.
    // e.g. For IMF, the delay is in cycles, and there are 700 cycles in a second. So the IMF refresh function returns delay / 700.
    // This is the number of seconds that the current OPL2 chip settings are valid to generate sound for.
    refresh: function() {
        // timeToNextUpdate is in ticks. We need to work out what fraction of a second this is.
        return this.timeToNextUpdate / ((this.basicTempo / 60) * this.ticksPerBeat);
    },

    rewind: function() {

    },

    op_num: [0x00, 0x01, 0x02, 0x08, 0x09, 0x0A, 0x10, 0x11, 0x12],

    volumetable: [
        0, 1, 3, 5, 6, 8, 10, 11,
        13, 14, 16, 17, 19, 20, 22, 23,
        25, 26, 27, 29, 30, 32, 33, 34,
        36, 37, 39, 41, 43, 45, 47, 49,
        50, 52, 54, 55, 57, 59, 60, 61,
        63, 64, 66, 67, 68, 69, 71, 72,
        73, 74, 75, 76, 77, 79, 80, 81,
        82, 83, 84, 84, 85, 86, 87, 88,
        89, 90, 91, 92, 92, 93, 94, 95,
        96, 96, 97, 98, 99, 99, 100, 101,
        101, 102, 103, 103, 104, 105, 105, 106,
        107, 107, 108, 109, 109, 110, 110, 111,
        112, 112, 113, 113, 114, 114, 115, 115,
        116, 117, 117, 118, 118, 119, 119, 120,
        120, 121, 121, 122, 122, 123, 123, 123,
        124, 124, 125, 125, 126, 126, 127, 127
    ],
    
    blockData: [
        [ 48.50336838, 21.09131869 ],
        [ 97.00673676, 10.54565935 ],
        [ 194.0134735, 5.272829673 ],
        [ 388.026947,  2.636414836 ],
        [ 776.053894,  1.318207418 ],
        [ 1552.107788, 0.659103709 ],
        [ 3104.215576, 0.329551854 ],
        [ 6208.431152, 0.164775927 ]
    ],
    
    OPL2CHANNELS: 9
});
},{"extend":10}],2:[function(_dereq_,module,exports){
module.exports = {
    OPL3: _dereq_('./lib/opl3'),
    format: {
	ROL: _dereq_('./format/rol')
    },
    WAV: _dereq_('wav-arraybuffer'),
    ConvertTo32Bit: _dereq_('pcm-bitdepth-converter').From16To32Bit,
    Normalizer: _dereq_('pcm-normalizer'),
    Player: _dereq_('./lib/player')
};

},{"./format/rol":1,"./lib/opl3":3,"./lib/player":4,"pcm-bitdepth-converter":15,"pcm-normalizer":16,"wav-arraybuffer":45}],3:[function(_dereq_,module,exports){
var util = _dereq_('util');
var extend = _dereq_('extend');

function OPL3(){
    this.nts = 0;
    this.dam = 0;
    this.dvb = 0;
    this.ryt = 0;
    this.bd = 0;
    this.sd = 0;
    this.tom = 0;
    this.tc = 0;
    this.hh = 0;
    this._new = 0;
    this.connectionsel = 0;
    this.vibratoIndex = 0;
    this.tremoloIndex = 0;

    this.registers = new Int32Array(0x200);
    this.channels = [new Array(9), new Array(9)];

    this.initOperators();
    this.initChannels2op();
    this.initChannels4op();
    this.initRhythmChannels();
    this.initChannels();

    this.output = new Int16Array(2);
    this.outputBuffer = new Float64Array(4);
    this.outputChannelNumber = 2;
}
module.exports = OPL3;

extend(OPL3.prototype, {
    read: function(output, seek){
        var offset = seek || 0;
        output = output || this.output;
        var converterScale = output instanceof Float32Array ? 32768 : 1;

        do{
            var channelOutput, outputChannelNumber;

            for (outputChannelNumber = 0; outputChannelNumber < 4; outputChannelNumber++){
                this.outputBuffer[outputChannelNumber] = 0;
            }

            // If _new = 0, use OPL2 mode with 9 channels. If _new = 1, use OPL3 18 channels;
            for (var array = 0; array < (this._new + 1); array++){
                for (var channelNumber = 0; channelNumber < 9; channelNumber++){
                    // Reads output from each OPL3 channel, and accumulates it in the output buffer:
                    channelOutput = this.channels[array][channelNumber].getChannelOutput();
                    for (outputChannelNumber = 0; outputChannelNumber < 4; outputChannelNumber++){
                        this.outputBuffer[outputChannelNumber] += channelOutput[outputChannelNumber];
                    }
                }
            }

            // Normalizes the output buffer after all channels have been added,
            // with a maximum of 18 channels,
            // and multiplies it to get the 16 bit signed output.
            for (outputChannelNumber = 0; outputChannelNumber < this.outputChannelNumber; outputChannelNumber++){
                output[offset + outputChannelNumber] = ((this.outputBuffer[outputChannelNumber] / 18) * 0x7FFF) / converterScale;
            }

            // Advances the OPL3-wide vibrato index, which is used by
            // PhaseGenerator.getPhase() in each Operator.
            this.vibratoIndex++;
            if (this.vibratoIndex >= OPL3Data.vibratoTable[this.dvb].length) this.vibratoIndex = 0;
            // Advances the OPL3-wide tremolo index, which is used by
            // EnvelopeGenerator.getEnvelope() in each Operator.
            this.tremoloIndex++;
            if (this.tremoloIndex >= OPL3Data.tremoloTable[this.dam].length) this.tremoloIndex = 0;

            offset += this.outputChannelNumber;
        }while (offset < output.length);

        return output;
    },
    write: function(array, address, data){
        // The OPL3 has two registers arrays, each with adresses ranging
        // from 0x00 to 0xF5.
        // This emulator uses one array, with the two original register arrays
        // starting at 0x00 and at 0x100.
        var registerAddress = (array << 8) | address;
        // If the address is out of the OPL3 memory map, returns.
        if (registerAddress < 0 || registerAddress >= 0x200) return;

        this.registers[registerAddress] = data;
        switch (address & 0xe0){
            // The first 3 bits masking gives the type of the register by using its base address:
            // 0x00, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0
            // When it is needed, we further separate the register type inside each base address,
            // which is the case of 0x00 and 0xA0.

            // Through out this emulator we will use the same name convention to
            // reference a byte with several bit registers.
            // The name of each bit register will be followed by the number of bits
            // it occupies inside the byte.
            // Numbers without accompanying names are unused bits.
            case 0x00:
                // Unique registers for the entire OPL3:
                if (array == 1){
                    if (address == 0x04) this.update_2_CONNECTIONSEL6();
                    else if (address == 0x05){
                        //console.log(array, address, data);
                        this.update_7_NEW1();
                    }
                }else if (address == 0x08) this.update_1_NTS1_6();
                break;
            case 0xA0:
                // 0xBD is a control register for the entire OPL3:
                if (address == 0xBD){
                    if (array == 0) this.update_DAM1_DVB1_RYT1_BD1_SD1_TOM1_TC1_HH1();
                    break;
                }
                // Registers for each channel are in A0-A8, B0-B8, C0-C8, in both register arrays.
                // 0xB0...0xB8 keeps kon,block,fnum(h) for each channel.
                if ((address & 0xF0) == 0xB0 && address <= 0xB8){
                    // If the address is in the second register array, adds 9 to the channel number.
                    // The channel number is given by the last four bits, like in A0,...,A8.
                    this.channels[array][address & 0x0F].update_2_KON1_BLOCK3_FNUMH2();
                    break;
                }
                // 0xA0...0xA8 keeps fnum(l) for each channel.
                if ((address & 0xF0) == 0xA0 && address <= 0xA8) this.channels[array][address&0x0F].update_FNUML8();
                break;
            // 0xC0...0xC8 keeps cha,chb,chc,chd,fb,cnt for each channel:
            case 0xC0:
                if (address <= 0xC8) this.channels[array][address & 0x0F].update_CHD1_CHC1_CHB1_CHA1_FB3_CNT1();
                break;
            // Registers for each of the 36 Operators:
            default:
                var operatorOffset = address & 0x1F;
                if (!this.operators[array][operatorOffset]) break;
                switch (address & 0xE0){
                    // 0x20...0x35 keeps am,vib,egt,ksr,mult for each operator:
                    case 0x20:
                        this.operators[array][operatorOffset].update_AM1_VIB1_EGT1_KSR1_MULT4();
                        break;
                    // 0x40...0x55 keeps ksl,tl for each operator:
                    case 0x40:
                        this.operators[array][operatorOffset].update_KSL2_TL6();
                        break;
                    // 0x60...0x75 keeps ar,dr for each operator:
                    case 0x60:
                        this.operators[array][operatorOffset].update_AR4_DR4();
                        break;
                    // 0x80...0x95 keeps sl,rr for each operator:
                    case 0x80:
                        this.operators[array][operatorOffset].update_SL4_RR4();
                        break;
                    // 0xE0...0xF5 keeps ws for each operator:
                    case 0xE0:
                        this.operators[array][operatorOffset].update_5_WS3();
                }
        }
    },
    initOperators: function(){
        // The YMF262 has 36 operators:
        this.operators = [[], []];
        for (var array = 0; array < 2; array++){
            for (var group = 0; group <= 0x10; group += 8){
                for (var offset = 0; offset < 6; offset++){
                    var baseAddress = (array << 8) | (group + offset);
                    this.operators[array][group + offset] = new Operator(baseAddress, this);
                }
            }
        }

        // Create specific operators to switch when in rhythm mode:
        this.highHatOperator = new HighHatOperator(this);
        this.snareDrumOperator = new SnareDrumOperator(this);
        this.tomTomOperator = new TomTomOperator(this);
        this.topCymbalOperator = new TopCymbalOperator(this);

        // Save operators when they are in non-rhythm mode:
        // Channel 7:
        this.highHatOperatorInNonRhythmMode = this.operators[0][0x11];
        this.snareDrumOperatorInNonRhythmMode = this.operators[0][0x14];
        // Channel 8:
        this.tomTomOperatorInNonRhythmMode = this.operators[0][0x12];
        this.topCymbalOperatorInNonRhythmMode = this.operators[0][0x15];
    },
    initChannels2op: function(){
        // The YMF262 has 18 2-op channels.
        // Each 2-op channel can be at a serial or parallel operator configuration:
        this.channels2op = [[], []];

        for (var array = 0; array < 2; array++){
            for (var channelNumber = 0; channelNumber < 3; channelNumber++){
                var baseAddress = (array << 8) | channelNumber;
                // Channels 1, 2, 3 -> Operator offsets 0x0,0x3; 0x1,0x4; 0x2,0x5
                this.channels2op[array][channelNumber] = new Channel2op(baseAddress, this.operators[array][channelNumber], this.operators[array][channelNumber + 0x3], this);
                // Channels 4, 5, 6 -> Operator offsets 0x8,0xB; 0x9,0xC; 0xA,0xD
                this.channels2op[array][channelNumber + 3] = new Channel2op(baseAddress + 3, this.operators[array][channelNumber + 0x8], this.operators[array][channelNumber + 0xb], this);
                // Channels 7, 8, 9 -> Operators 0x10,0x13; 0x11,0x14; 0x12,0x15
                this.channels2op[array][channelNumber + 6] = new Channel2op(baseAddress + 6, this.operators[array][channelNumber + 0x10], this.operators[array][channelNumber + 0x13], this);
            }
        }
    },
    initChannels4op: function(){
        // The YMF262 has 3 4-op channels in each array:
        this.channels4op = [[], []];

        for (var array = 0; array < 2; array++){
            for (var channelNumber = 0; channelNumber < 3; channelNumber++){
                var baseAddress = (array << 8) | channelNumber;
                // Channels 1, 2, 3 -> Operators 0x0,0x3,0x8,0xB; 0x1,0x4,0x9,0xC; 0x2,0x5,0xA,0xD;
                this.channels4op[array][channelNumber] = new Channel4op(
                    baseAddress,
                    this.operators[array][channelNumber],
                    this.operators[array][channelNumber + 0x3],
                    this.operators[array][channelNumber + 0x8],
                    this.operators[array][channelNumber + 0xb],
                    this
                );
            }
        }
    },
    initRhythmChannels: function(){
        this.bassDrumChannel = new BassDrumChannel(this);
        this.highHatSnareDrumChannel = new HighHatSnareDrumChannel(this);
        this.tomTomTopCymbalChannel = new TomTomTopCymbalChannel(this);
    },
    initChannels: function(){
        // Channel is an abstract class that can be a 2-op, 4-op, rhythm or disabled channel,
        // depending on the OPL3 configuration at the time.
        // channels[] inits as a 2-op serial channel array:
        for (var array = 0; array < 2; array++){
            for (var i = 0; i < 9; i++) this.channels[array][i] = this.channels2op[array][i];
        }

        // Unique instance to fill future gaps in the Channel array,
        // when there will be switches between 2op and 4op mode.
        this.disabledChannel = new DisabledChannel(this);
    },
    update_1_NTS1_6: function(){
        var _1_nts1_6 = this.registers[OPL3Data._1_NTS1_6_Offset];
        // Note Selection. This register is used in Channel.updateOperators() implementations,
        // to calculate the channel´s Key Scale Number.
        // The value of the actual envelope rate follows the value of
        // OPL3.nts,Operator.keyScaleNumber and Operator.ksr
        this.nts = (_1_nts1_6 & 0x40) >> 6;
    },
    update_DAM1_DVB1_RYT1_BD1_SD1_TOM1_TC1_HH1: function(){
        var dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 = this.registers[OPL3Data.DAM1_DVB1_RYT1_BD1_SD1_TOM1_TC1_HH1_Offset];
        // Depth of amplitude. This register is used in EnvelopeGenerator.getEnvelope();
        this.dam = (dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x80) >> 7;

        // Depth of vibrato. This register is used in PhaseGenerator.getPhase();
        this.dvb = (dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x40) >> 6;

        var new_ryt = (dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x20) >> 5;
        if (new_ryt != this.ryt){
            this.ryt = new_ryt;
            this.setRhythmMode();
        }

        var new_bd = (dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x10) >> 4;
        if (new_bd != this.bd){
            this.bd = new_bd;
            if (this.bd == 1){
                this.bassDrumChannel.op1.keyOn();
                this.bassDrumChannel.op2.keyOn();
            }
        }

        var new_sd = (dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x08) >> 3;
        if (new_sd != this.sd){
            this.sd = new_sd;
            if (this.sd == 1) this.snareDrumOperator.keyOn();
        }

        var new_tom = (dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x04) >> 2;
        if (new_tom != this.tom) {
            this.tom = new_tom;
            if (this.tom == 1) this.tomTomOperator.keyOn();
        }

        var new_tc = (dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x02) >> 1;
        if (new_tc != this.tc) {
            this.tc = new_tc;
            if (this.tc == 1) this.topCymbalOperator.keyOn();
        }

        var new_hh = dam1_dvb1_ryt1_bd1_sd1_tom1_tc1_hh1 & 0x01;
        if (new_hh != this.hh) {
            this.hh = new_hh;
            if (this.hh == 1) this.highHatOperator.keyOn();
        }
    },
    update_7_NEW1: function(){
        var _7_new1 = this.registers[OPL3Data._7_NEW1_Offset];
        // OPL2/OPL3 mode selection. This register is used in
        // OPL3.read(), OPL3.write() and Operator.getOperatorOutput();
        this._new = (_7_new1 & 0x01);
        if (this._new == 1) this.setEnabledChannels();
        this.set4opConnections();
    },
    setEnabledChannels: function(){
        for (var array = 0; array < 2; array++){
            for (var i = 0; i < 9; i++){
                var baseAddress = this.channels[array][i].channelBaseAddress;
                this.registers[baseAddress + ChannelData.CHD1_CHC1_CHB1_CHA1_FB3_CNT1_Offset] |= 0xf0;
                this.channels[array][i].update_CHD1_CHC1_CHB1_CHA1_FB3_CNT1();
            }
        }
    },
    update_2_CONNECTIONSEL6: function(){
        // This method is called only if _new is set.
        var _2_connectionsel6 = this.registers[OPL3Data._2_CONNECTIONSEL6_Offset];
        // 2-op/4-op channel selection. This register is used here to configure the OPL3.channels[] array.
        this.connectionsel = (_2_connectionsel6 & 0x3f);
        this.set4opConnections();
    },
    set4opConnections: function(){
        // bits 0, 1, 2 sets respectively 2-op channels (1,4), (2,5), (3,6) to 4-op operation.
        // bits 3, 4, 5 sets respectively 2-op channels (10,13), (11,14), (12,15) to 4-op operation.
        for (var array = 0; array < 2; ++array){
            for (var i = 0; i < 3; ++i){
                if (this._new == 1){
                    var shift = array * 3 + i;
                    var connectionBit = (this.connectionsel >> shift) & 0x01;
                    if (connectionBit == 1){
                        this.channels[array][i] = this.channels4op[array][i];
                        this.channels[array][i + 3] = this.disabledChannel;
                        this.channels[array][i].updateChannel();
                        continue;
                    }
                }

                this.channels[array][i] = this.channels2op[array][i];
                this.channels[array][i + 3] = this.channels2op[array][i + 3];
                this.channels[array][i].updateChannel();
                this.channels[array][i + 3].updateChannel();
            }
        }
    },
    setRhythmMode: function(){
        var i;
        if (this.ryt == 1){
            this.channels[0][6] = this.bassDrumChannel;
            this.channels[0][7] = this.highHatSnareDrumChannel;
            this.channels[0][8] = this.tomTomTopCymbalChannel;
            this.operators[0][0x11] = this.highHatOperator;
            this.operators[0][0x14] = this.snareDrumOperator;
            this.operators[0][0x12] = this.tomTomOperator;
            this.operators[0][0x15] = this.topCymbalOperator;
        }else{
            for (i = 6; i <= 8; i++) this.channels[0][i] = this.channels2op[0][i];
            this.operators[0][0x11] = this.highHatOperatorInNonRhythmMode;
            this.operators[0][0x14] = this.snareDrumOperatorInNonRhythmMode;
            this.operators[0][0x12] = this.tomTomOperatorInNonRhythmMode;
            this.operators[0][0x15] = this.topCymbalOperatorInNonRhythmMode;
        }

        for (i = 6; i <= 8; i++) this.channels[0][i].updateChannel();
    }
});

function Channel(baseAddress, opl){
    this.opl = opl;
    this.channelBaseAddress = baseAddress;

    this.fnuml = 0;
    this.fnumh = 0;
    this.kon = 0;
    this.block = 0;
    this.cha = 0;
    this.chb = 0;
    this.chc = 0;
    this.chd = 0;
    this.fb = 0;
    this.cnt = 0;

    this.feedback = [0, 0];
    this.toPhase = 4;

    this.output = new Float64Array(4);
}

extend(Channel.prototype, {
    update_2_KON1_BLOCK3_FNUMH2: function(){
        var _2_kon1_block3_fnumh2 = this.opl.registers[this.channelBaseAddress + ChannelData._2_KON1_BLOCK3_FNUMH2_Offset];

        // Frequency Number (hi-register) and Block. These two registers, together with fnuml,
        // sets the Channel´s base frequency;
        this.block = (_2_kon1_block3_fnumh2 & 0x1c) >> 2;
        this.fnumh = _2_kon1_block3_fnumh2 & 0x03;
        this.updateOperators();

        // Key On. If changed, calls Channel.keyOn() / keyOff().
        var newKon = (_2_kon1_block3_fnumh2 & 0x20) >> 5;
        if (newKon != this.kon){
            if (newKon == 1) this.keyOn();
            else this.keyOff();
            this.kon = newKon;
        }
    },
    update_FNUML8: function(){
        var fnuml8 = this.opl.registers[this.channelBaseAddress + ChannelData.FNUML8_Offset];
        // Frequency Number, low register.
        this.fnuml = fnuml8 & 0xff;

        this.updateOperators();
    },
    update_CHD1_CHC1_CHB1_CHA1_FB3_CNT1: function(){
        var chd1_chc1_chb1_cha1_fb3_cnt1 = this.opl.registers[this.channelBaseAddress + ChannelData.CHD1_CHC1_CHB1_CHA1_FB3_CNT1_Offset];

        this.chd = (chd1_chc1_chb1_cha1_fb3_cnt1 & 0x80) >> 7;
        this.chc = (chd1_chc1_chb1_cha1_fb3_cnt1 & 0x40) >> 6;
        this.chb = (chd1_chc1_chb1_cha1_fb3_cnt1 & 0x20) >> 5;
        this.cha = (chd1_chc1_chb1_cha1_fb3_cnt1 & 0x10) >> 4;
        this.fb = (chd1_chc1_chb1_cha1_fb3_cnt1 & 0x0e) >> 1;
        this.cnt = chd1_chc1_chb1_cha1_fb3_cnt1 & 0x01;

        this.updateOperators();
    },
    updateChannel: function(){
        this.update_2_KON1_BLOCK3_FNUMH2();
        this.update_FNUML8();
        this.update_CHD1_CHC1_CHB1_CHA1_FB3_CNT1();
    },
    getInFourChannels: function(channelOutput){
        if (this.opl._new == 0){
            this.output[0] = this.output[1] = this.output[2] = this.output[3] = channelOutput;
        }else{
            this.output[0] = (this.cha == 1) ? channelOutput : 0;
            this.output[1] = (this.chb == 1) ? channelOutput : 0;
            this.output[2] = (this.chc == 1) ? channelOutput : 0;
            this.output[3] = (this.chd == 1) ? channelOutput : 0;
        }

        return this.output;
    }
});

function Channel2op(baseAddress, o1, o2, opl){
    Channel.call(this, baseAddress, opl);
    this.op1 = o1;
    this.op2 = o2;
}
util.inherits(Channel2op, Channel);

Channel2op.prototype.getChannelOutput = function(){
    var channelOutput = 0, op1Output = 0, op2Output = 0;
    // The feedback uses the last two outputs from
    // the first operator, instead of just the last one.
    var feedbackOutput = (this.feedback[0] + this.feedback[1]) / 2;

    if (this.cnt == 0){
        // CNT = 0, the operators are in series, with the first in feedback.
        if (this.op2.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF) return this.getInFourChannels(0);
        op1Output = this.op1.getOperatorOutput(feedbackOutput);
        channelOutput = this.op2.getOperatorOutput(op1Output * this.toPhase);
    }else{
        // CNT = 1, the operators are in parallel, with the first in feedback.
        if (this.op1.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF &&
            this.op2.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF) return this.getInFourChannels(0);
        op1Output = this.op1.getOperatorOutput(feedbackOutput);
        op2Output = this.op2.getOperatorOutput(Operator.noModulator);
        channelOutput = (op1Output + op2Output) / 2;
    }

    this.feedback[0] = this.feedback[1];
    this.feedback[1] = (op1Output * ChannelData.feedback[this.fb]) % 1;
    return this.getInFourChannels(channelOutput);
};
Channel2op.prototype.keyOn = function(){
    this.op1.keyOn();
    this.op2.keyOn();
    this.feedback[0] = this.feedback[1] = 0;
};
Channel2op.prototype.keyOff = function(){
    this.op1.keyOff();
    this.op2.keyOff();
};
Channel2op.prototype.updateOperators = function(){
    // Key Scale Number, used in EnvelopeGenerator.setActualRates().
    var keyScaleNumber = this.block * 2 + ((this.fnumh >> this.opl.nts) & 0x01);
    var f_number = (this.fnumh << 8) | this.fnuml;
    this.op1.updateOperator(keyScaleNumber, f_number, this.block);
    this.op2.updateOperator(keyScaleNumber, f_number, this.block);
};

function Channel4op(baseAddress, o1, o2, o3, o4, opl){
    Channel.call(this, baseAddress, opl);
    this.op1 = o1;
    this.op2 = o2;
    this.op3 = o3;
    this.op4 = o4;
}
util.inherits(Channel4op, Channel);

Channel4op.prototype.getChannelOutput = function(){
    var channelOutput = 0,
        op1Output = 0, op2Output = 0, op3Output = 0, op4Output = 0;

    var secondChannelBaseAddress = this.channelBaseAddress + 3;
    var secondCnt = this.opl.registers[secondChannelBaseAddress + ChannelData.CHD1_CHC1_CHB1_CHA1_FB3_CNT1_Offset] & 1;
    var cnt4op = (this.cnt << 1) | secondCnt;

    var feedbackOutput = (this.feedback[0] + this.feedback[1]) / 2;

    switch (cnt4op) {
        case 0:
            if(this.op4.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF) return this.getInFourChannels(0);

            op1Output = this.op1.getOperatorOutput(feedbackOutput);
            op2Output = this.op2.getOperatorOutput(op1Output * this.toPhase);
            op3Output = this.op3.getOperatorOutput(op2Output * this.toPhase);

            channelOutput = this.op4.getOperatorOutput(op3Output * this.toPhase);
            break;
        case 1:
            if (this.op2.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF &&
                this.op4.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF) return this.getInFourChannels(0);

            op1Output = this.op1.getOperatorOutput(feedbackOutput);
            op2Output = this.op2.getOperatorOutput(op1Output * this.toPhase);

            op3Output = this.op3.getOperatorOutput(Operator.noModulator);
            op4Output = this.op4.getOperatorOutput(op3Output * this.toPhase);

            channelOutput = (op2Output + op4Output) / 2;
            break;
        case 2:
            if (this.op1.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF &&
                this.op4.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF) return this.getInFourChannels(0);

            op1Output = this.op1.getOperatorOutput(feedbackOutput);
            op2Output = this.op2.getOperatorOutput(Operator.noModulator);
            op3Output = this.op3.getOperatorOutput(op2Output * this.toPhase);
            op4Output = this.op4.getOperatorOutput(op3Output * this.toPhase);

            channelOutput = (op1Output + op4Output) / 2;
            break;
        case 3:
            if (this.op1.envelopeGenerator.stage==EnvelopeGenerator.Stage.OFF &&
                this.op3.envelopeGenerator.stage==EnvelopeGenerator.Stage.OFF &&
                this.op4.envelopeGenerator.stage==EnvelopeGenerator.Stage.OFF) return this.getInFourChannels(0);

            op1Output = this.op1.getOperatorOutput(feedbackOutput);
            op2Output = this.op2.getOperatorOutput(Operator.noModulator);
            op3Output = this.op3.getOperatorOutput(op2Output * this.toPhase);
            op4Output = this.op4.getOperatorOutput(Operator.noModulator);

            channelOutput = (op1Output + op3Output + op4Output) / 3;
            break;
    }

    this.feedback[0] = this.feedback[1];
    this.feedback[1] = (op1Output * ChannelData.feedback[this.fb]) % 1;

    return this.getInFourChannels(channelOutput);
};
Channel4op.prototype.keyOn = function(){
    this.op1.keyOn();
    this.op2.keyOn();
    this.op3.keyOn();
    this.op4.keyOn();
    this.feedback[0] = this.feedback[1] = 0;
};
Channel4op.prototype.keyOff = function(){
    this.op1.keyOff();
    this.op2.keyOff();
    this.op3.keyOff();
    this.op4.keyOff();
};
Channel4op.prototype.updateOperators = function(){
    // Key Scale Number, used in EnvelopeGenerator.setActualRates().
    var keyScaleNumber = this.block * 2 + ((this.fnumh >> this.opl.nts) & 0x01);
    var f_number = (this.fnumh << 8) | this.fnuml;
    this.op1.updateOperator(keyScaleNumber, f_number, this.block);
    this.op2.updateOperator(keyScaleNumber, f_number, this.block);
    this.op3.updateOperator(keyScaleNumber, f_number, this.block);
    this.op4.updateOperator(keyScaleNumber, f_number, this.block);
};

function DisabledChannel(opl){
    Channel.call(this, 0, opl);
    this.opl = opl;
}
util.inherits(DisabledChannel, Channel);

DisabledChannel.prototype.getChannelOutput = function(){ return this.getInFourChannels(0); };
DisabledChannel.prototype.keyOn = function(){ };
DisabledChannel.prototype.keyOff = function(){ };
DisabledChannel.prototype.updateOperators = function(){ };

function Operator(baseAddress, opl){
    this.opl = opl;

    this.operatorBaseAddress = baseAddress;
    this.phaseGenerator = new PhaseGenerator(opl);
    this.envelopeGenerator = new EnvelopeGenerator(opl);

    this.envelope = 0;
    this.am = 0;
    this.vib = 0;
    this.ksr = 0;
    this.egt = 0;
    this.mult = 0;
    this.ksl = 0;
    this.tl = 0;
    this.ar = 0;
    this.dr = 0;
    this.sl = 0;
    this.rr = 0;
    this.ws = 0;
    this.keyScaleNumber = 0;
    this.f_number = 0;
    this.block = 0;
}
Operator.noModulator = 0;

extend(Operator.prototype, {
    update_AM1_VIB1_EGT1_KSR1_MULT4: function(){
        var am1_vib1_egt1_ksr1_mult4 = this.opl.registers[this.operatorBaseAddress + OperatorData.AM1_VIB1_EGT1_KSR1_MULT4_Offset];

        // Amplitude Modulation. This register is used int EnvelopeGenerator.getEnvelope();
        this.am = (am1_vib1_egt1_ksr1_mult4 & 0x80) >> 7;
        // Vibrato. This register is used in PhaseGenerator.getPhase();
        this.vib = (am1_vib1_egt1_ksr1_mult4 & 0x40) >> 6;
        // Envelope Generator Type. This register is used in EnvelopeGenerator.getEnvelope();
        this.egt = (am1_vib1_egt1_ksr1_mult4 & 0x20) >> 5;
        // Key Scale Rate. Sets the actual envelope rate together with rate and keyScaleNumber.
        // This register os used in EnvelopeGenerator.setActualAttackRate().
        this.ksr = (am1_vib1_egt1_ksr1_mult4 & 0x10) >> 4;
        // Multiple. Multiplies the Channel.baseFrequency to get the Operator.operatorFrequency.
        // This register is used in PhaseGenerator.setFrequency().
        this.mult = am1_vib1_egt1_ksr1_mult4 & 0x0f;

        this.phaseGenerator.setFrequency(this.f_number, this.block, this.mult);
        this.envelopeGenerator.setActualAttackRate(this.ar, this.ksr, this.keyScaleNumber);
        this.envelopeGenerator.setActualDecayRate(this.dr, this.ksr, this.keyScaleNumber);
        this.envelopeGenerator.setActualReleaseRate(this.rr, this.ksr, this.keyScaleNumber);
    },
    update_KSL2_TL6: function(){
        var ksl2_tl6 = this.opl.registers[this.operatorBaseAddress + OperatorData.KSL2_TL6_Offset];

        // Key Scale Level. Sets the attenuation in accordance with the octave.
        this.ksl = (ksl2_tl6 & 0xc0) >> 6;
        // Total Level. Sets the overall damping for the envelope.
        this.tl = ksl2_tl6 & 0x3f;

        this.envelopeGenerator.setAtennuation(this.f_number, this.block, this.ksl);
        this.envelopeGenerator.setTotalLevel(this.tl);
    },
    update_AR4_DR4: function(){
        var ar4_dr4 = this.opl.registers[this.operatorBaseAddress + OperatorData.AR4_DR4_Offset];

        // Attack Rate.
        this.ar = (ar4_dr4 & 0xf0) >> 4;
        // Decay Rate.
        this.dr = ar4_dr4 & 0x0f;

        this.envelopeGenerator.setActualAttackRate(this.ar, this.ksr, this.keyScaleNumber);
        this.envelopeGenerator.setActualDecayRate(this.dr, this.ksr, this.keyScaleNumber);
    },
    update_SL4_RR4: function(){
        var sl4_rr4 = this.opl.registers[this.operatorBaseAddress + OperatorData.SL4_RR4_Offset];

        // Sustain Level.
        this.sl = (sl4_rr4 & 0xf0) >> 4;
        // Release Rate.
        this.rr = sl4_rr4 & 0x0f;

        this.envelopeGenerator.setActualSustainLevel(this.sl);
        this.envelopeGenerator.setActualReleaseRate(this.rr, this.ksr, this.keyScaleNumber);
    },
    update_5_WS3: function(){
        var _5_ws3 = this.opl.registers[this.operatorBaseAddress + OperatorData._5_WS3_Offset];
        this.ws = _5_ws3 & 0x07;
    },
    getOperatorOutput: function(modulator){
        if (this.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF) return 0;

        var envelopeInDB = this.envelopeGenerator.getEnvelope(this.egt, this.am);
        this.envelope = Math.pow(10, envelopeInDB / 10);

        // If it is in OPL2 mode, use first four waveforms only:
        this.ws = this.ws & ((this.opl._new << 2) + 3);
        var waveform = OperatorData.waveforms[this.ws];

        this.phase = this.phaseGenerator.getPhase(this.vib);

        return this.getOutput(modulator, this.phase, waveform);
    },
    getOutput: function(modulator, outputPhase, waveform) {
        outputPhase = (outputPhase + modulator) % 1;
        if (outputPhase < 0){
            outputPhase++;
            // If the double could not afford to be less than 1:
            outputPhase %= 1;
        }
        var sampleIndex = (outputPhase * OperatorData.waveLength) | 0;
        return waveform[sampleIndex] * this.envelope;
    },
    keyOn: function(){
        if (this.ar > 0){
            this.envelopeGenerator.keyOn();
            this.phaseGenerator.keyOn();
        }else this.envelopeGenerator.stage = EnvelopeGenerator.Stage.OFF;
    },
    keyOff: function(){
        this.envelopeGenerator.keyOff();
    },
    updateOperator: function(ksn, f_num, blk) {
        this.keyScaleNumber = ksn;
        this.f_number = f_num;
        this.block = blk;

        this.update_AM1_VIB1_EGT1_KSR1_MULT4();
        this.update_KSL2_TL6();
        this.update_AR4_DR4();
        this.update_SL4_RR4();
        this.update_5_WS3();
    }
});

function EnvelopeGenerator(opl){
    this.opl = opl;
    this.stage = EnvelopeGenerator.Stage.OFF;
    this.actualAttackRate = 0;
    this.actualDecayRate = 0;
    this.actualReleaseRate = 0;
    this.xAttackIncrement = 0;
    this.xMinimumInAttack = 0;
    this.dBdecayIncrement = 0;
    this.dBreleaseIncrement = 0;
    this.attenuation = 0;
    this.totalLevel = 0;
    this.sustainLevel = 0;
    this.x = this.dBtoX(-96);
    this.resolutionMaximum = this.dBtoX(-0.1875);
    this.percentage10 = this.percentageToX(0.1);
    this.percentage90 = this.percentageToX(0.9);
    
    this.envelope = -96;
}
EnvelopeGenerator.Stage = {
    ATTACK: 'ATTACK',
    DECAY: 'DECAY',
    SUSTAIN: 'SUSTAIN',
    RELEASE: 'RELEASE',
    OFF: 'OFF'
};

extend(EnvelopeGenerator.prototype, {
    setActualSustainLevel: function(sl){
        // If all SL bits are 1, sustain level is set to -93 dB:
        if (sl == 0x0f){
            this.sustainLevel = -93;
            return;
        }
        // The datasheet states that the SL formula is
        // sustainLevel = -24*d7 -12*d6 -6*d5 -3*d4,
        // translated as:
        this.sustainLevel = -3 * sl;
    },
    setTotalLevel: function(tl) {
        // The datasheet states that the TL formula is
        // TL = -(24*d5 + 12*d4 + 6*d3 + 3*d2 + 1.5*d1 + 0.75*d0),
        // translated as:
        this.totalLevel = tl * -0.75;
    },
    setAtennuation: function(f_number, block, ksl){
        var hi4bits = (f_number >> 6) & 0x0f;
        switch (ksl){
            case 0:
                this.attenuation = 0;
                break;
            case 1:
                // ~3 dB/Octave
                this.attenuation = OperatorData.ksl3dBtable[hi4bits][block];
                break;
            case 2:
                // ~1.5 dB/Octave
                this.attenuation = OperatorData.ksl3dBtable[hi4bits][block] / 2;
                break;
            case 3:
                // ~6 dB/Octave
                this.attenuation = OperatorData.ksl3dBtable[hi4bits][block] * 2;
        }
    },
    setActualAttackRate: function(attackRate, ksr, keyScaleNumber) {
        // According to the YMF278B manual's OPL3 section, the attack curve is exponential,
        // with a dynamic range from -96 dB to 0 dB and a resolution of 0.1875 dB
        // per level.
        //
        // This method sets an attack increment and attack minimum value
        // that creates a exponential dB curve with 'period0to100' seconds in length
        // and 'period10to90' seconds between 10% and 90% of the curve total level.
        this.actualAttackRate = this.calculateActualRate(attackRate, ksr, keyScaleNumber) | 0;
        var period0to100inSeconds = EnvelopeGeneratorData.attackTimeValuesTable[this.actualAttackRate][0] / 1000;
        var period0to100inSamples = (period0to100inSeconds * OPL3Data.sampleRate) | 0;
        var period10to90inSeconds = EnvelopeGeneratorData.attackTimeValuesTable[this.actualAttackRate][1] / 1000;
        var period10to90inSamples = (period10to90inSeconds * OPL3Data.sampleRate) | 0;
        // The x increment is dictated by the period between 10% and 90%:
        this.xAttackIncrement = OPL3Data.calculateIncrement(this.percentage10, this.percentage90, period10to90inSeconds);
        // Discover how many samples are still from the top.
        // It cannot reach 0 dB, since x is a logarithmic parameter and would be
        // negative infinity. So we will use -0.1875 dB as the resolution
        // maximum.
        //
        // percentageToX(0.9) + samplesToTheTop*xAttackIncrement = dBToX(-0.1875); ->
        // samplesToTheTop = (dBtoX(-0.1875) - percentageToX(0.9)) / xAttackIncrement); ->
        // period10to100InSamples = period10to90InSamples + samplesToTheTop; ->
        var period10to100inSamples = (period10to90inSamples + (this.resolutionMaximum - this.percentage90) / this.xAttackIncrement) | 0;
        // Discover the minimum x that, through the attackIncrement value, keeps
        // the 10%-90% period, and reaches 0 dB at the total period:
        this.xMinimumInAttack = this.percentage10 - (period0to100inSamples - period10to100inSamples) * this.xAttackIncrement;
    },
    setActualDecayRate: function(decayRate, ksr, keyScaleNumber){
        this.actualDecayRate = this.calculateActualRate(decayRate, ksr, keyScaleNumber) | 0;
        var period10to90inSeconds = EnvelopeGeneratorData.decayAndReleaseTimeValuesTable[this.actualDecayRate][1] / 1000;
        // Differently from the attack curve, the decay/release curve is linear.
        // The dB increment is dictated by the period between 10% and 90%:
        this.dBdecayIncrement = OPL3Data.calculateIncrement(this.percentageToDB(0.1), this.percentageToDB(0.9), period10to90inSeconds);
    },
    setActualReleaseRate: function(releaseRate, ksr, keyScaleNumber){
        this.actualReleaseRate = this.calculateActualRate(releaseRate, ksr, keyScaleNumber) | 0;
        var period10to90inSeconds = EnvelopeGeneratorData.decayAndReleaseTimeValuesTable[this.actualReleaseRate][1] / 1000;
        this.dBreleaseIncrement = OPL3Data.calculateIncrement(this.percentageToDB(0.1), this.percentageToDB(0.9), period10to90inSeconds);
    },
    calculateActualRate: function(rate, ksr, keyScaleNumber){
        var rof = EnvelopeGeneratorData.rateOffset[ksr][keyScaleNumber];
        var actualRate = rate * 4 + rof;
        // If, as an example at the maximum, rate is 15 and the rate offset is 15,
        // the value would
        // be 75, but the maximum allowed is 63:
        if (actualRate > 63) actualRate = 63;
        return actualRate;
    },
    getEnvelope: function(egt, am){
        // The datasheets attenuation values
        // must be halved to match the real OPL3 output.
        var envelopeSustainLevel = this.sustainLevel / 2;
        var envelopeTremolo = OPL3Data.tremoloTable[this.opl.dam][this.opl.tremoloIndex] / 2;
        var envelopeAttenuation = this.attenuation / 2;
        var envelopeTotalLevel = this.totalLevel / 2;

        var envelopeMinimum = -96;
        var envelopeResolution = 0.1875;

        var outputEnvelope;
        //
        // Envelope Generation
        //
        switch (this.stage){
            case EnvelopeGenerator.Stage.ATTACK:
                // Since the attack is exponential, it will never reach 0 dB, so
                // we´ll work with the next to maximum in the envelope resolution.
                if (this.envelope < -envelopeResolution && this.xAttackIncrement != -Infinity){
                    // The attack is exponential.
                    this.envelope = -Math.pow(2, this.x);
                    this.x += this.xAttackIncrement;
                    break;
                }else{
                    // It is needed here to explicitly set envelope = 0, since
                    // only the attack can have a period of
                    // 0 seconds and produce an infinity envelope increment.
                    this.envelope = 0;
                    this.stage = EnvelopeGenerator.Stage.DECAY;
                }
            case EnvelopeGenerator.Stage.DECAY:
                // The decay and release are linear.
                if (this.envelope > envelopeSustainLevel){
                    this.envelope -= this.dBdecayIncrement;
                    break;
                }else this.stage = EnvelopeGenerator.Stage.SUSTAIN;
            case EnvelopeGenerator.Stage.SUSTAIN:
                // The Sustain stage is mantained all the time of the Key ON,
                // even if we are in non-sustaining mode.
                // This is necessary because, if the key is still pressed, we can
                // change back and forth the state of EGT, and it will release and
                // hold again accordingly.
                if (egt == 1) break;
                else{
                    if (this.envelope > envelopeMinimum) this.envelope -= this.dBreleaseIncrement;
                    else this.stage = EnvelopeGenerator.Stage.OFF;
                }
                break;
            case EnvelopeGenerator.Stage.RELEASE:
                // If we have Key OFF, only here we are in the Release stage.
                // Now, we can turn EGT back and forth and it will have no effect,i.e.,
                // it will release inexorably to the Off stage.
                if (this.envelope > envelopeMinimum) this.envelope -= this.dBreleaseIncrement;
                else this.stage = EnvelopeGenerator.Stage.OFF;
        }

        // Ongoing original envelope
        outputEnvelope = this.envelope;

        //Tremolo
        if (am == 1) outputEnvelope += envelopeTremolo;

        //Attenuation
        outputEnvelope += envelopeAttenuation;

        //Total Level
        outputEnvelope += envelopeTotalLevel;

        return outputEnvelope;
    },
    keyOn: function(){
        // If we are taking it in the middle of a previous envelope,
        // start to rise from the current level:
        // envelope = - (2 ^ x); ->
        // 2 ^ x = -envelope ->
        // x = log2(-envelope); ->
        var xCurrent = Math.log2(-this.envelope);
        this.x = xCurrent < this.xMinimumInAttack ? xCurrent : this.xMinimumInAttack;
        this.stage = EnvelopeGenerator.Stage.ATTACK;
    },
    keyOff: function(){
        if (this.stage != EnvelopeGenerator.Stage.OFF) this.stage = EnvelopeGenerator.Stage.RELEASE;
    },
    dBtoX: function(dB){
        return Math.log2(-dB);
    },
    percentageToDB: function(percentage){
        return Math.log10(percentage) * 10;
    },
    percentageToX: function(percentage){
        return this.dBtoX(this.percentageToDB(percentage));
    }
});

function PhaseGenerator(opl){
    this.opl = opl;
    this.phase = 0;
    this.phaseIncrement = 0;
}

extend(PhaseGenerator.prototype, {
    setFrequency: function(f_number, block, mult){
        // This frequency formula is derived from the following equation:
        // f_number = baseFrequency * pow(2,19) / sampleRate / pow(2,block-1);
        var baseFrequency = f_number * Math.pow(2, block - 1) * OPL3Data.sampleRate / Math.pow(2, 19);
        var operatorFrequency = baseFrequency * OperatorData.multTable[mult];

        // phase goes from 0 to 1 at
        // period = (1/frequency) seconds ->
        // Samples in each period is (1/frequency)*sampleRate =
        // = sampleRate/frequency ->
        // So the increment in each sample, to go from 0 to 1, is:
        // increment = (1-0) / samples in the period ->
        // increment = 1 / (OPL3Data.sampleRate/operatorFrequency) ->
        this.phaseIncrement = operatorFrequency / OPL3Data.sampleRate;
    },
    getPhase: function(vib){
        if (vib == 1){
            // phaseIncrement = (operatorFrequency * vibrato) / sampleRate
            this.phase += this.phaseIncrement * OPL3Data.vibratoTable[this.opl.dvb][this.opl.vibratoIndex];
        }else{
            // phaseIncrement = operatorFrequency / sampleRate
            this.phase += this.phaseIncrement;
        }

        this.phase %= 1;
        return this.phase;
    },
    keyOn: function(){
        this.phase = 0;
    }
});

function RhythmChannel(baseAddress, o1, o2, opl){
    Channel2op.call(this, baseAddress, o1, o2, opl);
}
util.inherits(RhythmChannel, Channel2op);

RhythmChannel.prototype.getChannelOutput = function(){
    var channelOutput = 0, op1Output = 0, op2Output = 0;

    // Note that, different from the common channel,
    // we do not check to see if the Operator's envelopes are Off.
    // Instead, we always do the calculations,
    // to update the publicly available phase.
    op1Output = this.op1.getOperatorOutput(Operator.noModulator);
    op2Output = this.op2.getOperatorOutput(Operator.noModulator);
    channelOutput = (op1Output + op2Output) / 2;

    return this.getInFourChannels(channelOutput);
};
RhythmChannel.prototype.keyOn = function(){ };
RhythmChannel.prototype.keyOff = function(){ };

function HighHatSnareDrumChannel(opl){
    RhythmChannel.call(this, 7, opl.highHatOperator, opl.snareDrumOperator, opl);
}
util.inherits(HighHatSnareDrumChannel, RhythmChannel);

function TomTomTopCymbalChannel(opl){
    RhythmChannel.call(this, 8, opl.tomTomOperator, opl.topCymbalOperator, opl);
}
util.inherits(TomTomTopCymbalChannel, RhythmChannel);

function TopCymbalOperator(baseAddress, opl){
    if (arguments.length == 1){
        opl = baseAddress;
        baseAddress = 0x15;
    }
    Operator.call(this, baseAddress, opl);
}
util.inherits(TopCymbalOperator, Operator);

TopCymbalOperator.prototype.getOperatorOutput = function(modulator, externalPhase){
    // The Top Cymbal operator uses his own phase together with the High Hat phase.
    if (typeof externalPhase == 'undefined') externalPhase = this.opl.highHatOperator.phase * OperatorData.multTable[this.opl.highHatOperator.mult];

    var envelopeInDB = this.envelopeGenerator.getEnvelope(this.egt, this.am);
    this.envelope = Math.pow(10, envelopeInDB / 10);

    this.phase = this.phaseGenerator.getPhase(this.vib);

    var waveIndex = (this.ws & ((this.opl._new << 2) + 3)) | 0;
    var waveform = OperatorData.waveforms[waveIndex];

    // Empirically tested multiplied phase for the Top Cymbal:
    var carrierPhase = (8 * this.phase) % 1;
    var modulatorPhase = externalPhase;
    var modulatorOutput = this.getOutput(Operator.noModulator, modulatorPhase, waveform);
    var carrierOutput = this.getOutput(modulatorOutput, carrierPhase, waveform);

    var cycles = 4;
    if ((carrierPhase * cycles) % cycles > 0.1) carrierOutput = 0;

    return carrierOutput * 2;
};

function HighHatOperator(opl){
    TopCymbalOperator.call(this, 0x11, opl);
}
util.inherits(HighHatOperator, TopCymbalOperator);

HighHatOperator.prototype.getOperatorOutput = function(modulator){
    var topCymbalOperatorPhase = this.opl.topCymbalOperator.phase * OperatorData.multTable[this.opl.topCymbalOperator.mult];
    // The sound output from the High Hat resembles the one from
    // Top Cymbal, so we use the parent method and modifies his output
    // accordingly afterwards.
    var operatorOutput = TopCymbalOperator.prototype.getOperatorOutput.call(this, modulator, topCymbalOperatorPhase);
    if (operatorOutput == 0) operatorOutput = Math.random() * this.envelope;
    return operatorOutput;
};

function SnareDrumOperator(opl){
    Operator.call(this, 0x14, opl);
}
util.inherits(SnareDrumOperator, Operator);

SnareDrumOperator.prototype.getOperatorOutput = function(modulator){
    if (this.envelopeGenerator.stage == EnvelopeGenerator.Stage.OFF) return 0;

    var envelopeInDB = this.envelopeGenerator.getEnvelope(this.egt, this.am);
    this.envelope = Math.pow(10, envelopeInDB / 10);

    // If it is in OPL2 mode, use first four waveforms only:
    var waveIndex = (this.ws & ((this.opl._new << 2) + 3)) | 0;
    var waveform = OperatorData.waveforms[waveIndex];

    this.phase = this.opl.highHatOperator.phase * 2;

    var operatorOutput = this.getOutput(modulator, this.phase, waveform);

    var noise = Math.random() * this.envelope;

    if (operatorOutput / this.envelope != 1 && operatorOutput / this.envelope != -1){
        if (operatorOutput > 0) operatorOutput = noise;
        else if (operatorOutput < 0) operatorOutput = -noise;
        else operatorOutput = 0;
    }

    return operatorOutput * 2;
};

function TomTomOperator(opl){
    Operator.call(this, 0x12, opl);
}
util.inherits(TomTomOperator, Operator);

function BassDrumChannel(opl){
    Channel2op.call(this, 6, new Operator(0x10, opl), new Operator(0x13, opl), opl);
}
util.inherits(BassDrumChannel, Channel2op);

BassDrumChannel.prototype.getChannelOutput = function(){
    // Bass Drum ignores first operator, when it is in series.
    if (this.cnt == 1) this.op1.ar = 0;
    return Channel2op.prototype.getChannelOutput.call(this);
};
BassDrumChannel.prototype.keyOn = function(){ };
BassDrumChannel.prototype.keyOff = function(){ };

var OPL3Data = {
    // OPL3-wide registers offsets:
    _1_NTS1_6_Offset: 0x08,
    DAM1_DVB1_RYT1_BD1_SD1_TOM1_TC1_HH1_Offset: 0xbd,
    _7_NEW1_Offset: 0x105,
    _2_CONNECTIONSEL6_Offset: 0x104,
    sampleRate: 49700,
    // The first array is used when DVB=0 and the second array is used when DVB=1.
    vibratoTable: [new Float64Array(8192), new Float64Array(8192)],
    // First array used when AM = 0 and second array used when AM = 1.
    tremoloTable: [new Float64Array(13432), new Float64Array(13432)],
    loadVibratoTable: function(vibratoTable){
        // According to the YMF262 datasheet, the OPL3 vibrato repetition rate is 6.1 Hz.
        // According to the YMF278B manual, it is 6.0 Hz.
        // The information that the vibrato table has 8 levels standing 1024 samples each
        // was taken from the emulator by Jarek Burczynski and Tatsuyuki Satoh,
        // with a frequency of 6,06689453125 Hz, what  makes sense with the difference
        // in the information on the datasheets.

        var semitone = Math.pow(2, 1 / 12);
        var cent = Math.pow(semitone, 1 / 100);

        // When dvb=0, the depth is 7 cents, when it is 1, the depth is 14 cents.
        var DVB0 = Math.pow(cent, 7);
        var DVB1 = Math.pow(cent, 14);

        var i;
        for (i = 0; i < 1024; i++){
            vibratoTable[0][i] = vibratoTable[1][i] = 1;
        }

        for (; i < 2048; i++){
            vibratoTable[0][i] = Math.sqrt(DVB0);
            vibratoTable[1][i] = Math.sqrt(DVB1);
        }

        for (; i < 3072; i++){
            vibratoTable[0][i] = DVB0;
            vibratoTable[1][i] = DVB1;
        }

        for (; i < 4096; i++){
            vibratoTable[0][i] = Math.sqrt(DVB0);
            vibratoTable[1][i] = Math.sqrt(DVB1);
        }

        for (; i < 5120; i++){
            vibratoTable[0][i] = vibratoTable[1][i] = 1;
        }

        for (; i < 6144; i++){
            vibratoTable[0][i] = 1 / Math.sqrt(DVB0);
            vibratoTable[1][i] = 1 / Math.sqrt(DVB1);
        }

        for (; i < 7168; i++){
            vibratoTable[0][i] = 1 / DVB0;
            vibratoTable[1][i] = 1 / DVB1;
        }

        for (; i < 8192; i++){
            vibratoTable[0][i] = 1 / Math.sqrt(DVB0);
            vibratoTable[1][i] = 1 / Math.sqrt(DVB1);
        }
    },
    loadTremoloTable: function(tremoloTable){
        // The OPL3 tremolo repetition rate is 3.7 Hz.
        var tremoloFrequency = 3.7;

        // The tremolo depth is -1 dB when DAM = 0, and -4.8 dB when DAM = 1.
        var tremoloDepth = [-1, -4.8];

        //  According to the YMF278B manual's OPL3 section graph,
        //              the tremolo waveform is not
        //   \      /   a sine wave, but a single triangle waveform.
        //    \    /    Thus, the period to achieve the tremolo depth is T/2, and
        //     \  /     the increment in each T/2 section uses a frequency of 2*f.
        //      \/      Tremolo varies from 0 dB to depth, to 0 dB again, at frequency*2:
        var tremoloIncrement = [
            OPL3Data.calculateIncrement(tremoloDepth[0], 0, 1 / (2 * tremoloFrequency)),
            OPL3Data.calculateIncrement(tremoloDepth[1], 0, 1 / (2 * tremoloFrequency))
        ];
        var tremoloTableLength = (OPL3Data.sampleRate / tremoloFrequency) | 0;

        // This is undocumented. The tremolo starts at the maximum attenuation,
        // instead of at 0 dB:
        tremoloTable[0][0] = tremoloDepth[0];
        tremoloTable[1][0] = tremoloDepth[1];

        var counter = 0;
        // The first half of the triangle waveform:
        while (tremoloTable[0][counter] < 0){
            counter++;
            tremoloTable[0][counter] = tremoloTable[0][counter - 1] + tremoloIncrement[0];
            tremoloTable[1][counter] = tremoloTable[1][counter - 1] + tremoloIncrement[1];
        }

        // The second half of the triangle waveform:
        while (tremoloTable[0][counter] > tremoloDepth[0] && counter < tremoloTableLength - 1){
            counter++;
            tremoloTable[0][counter] = tremoloTable[0][counter - 1] - tremoloIncrement[0];
            tremoloTable[1][counter] = tremoloTable[1][counter - 1] - tremoloIncrement[1];
        }
    },
    calculateIncrement: function(begin, end, period){
        return (end - begin) / OPL3Data.sampleRate * (1 / period);
    }
};

OPL3Data.loadVibratoTable(OPL3Data.vibratoTable);
OPL3Data.loadTremoloTable(OPL3Data.tremoloTable);

var ChannelData = {
    _2_KON1_BLOCK3_FNUMH2_Offset: 0xb0,
    FNUML8_Offset: 0xa0,
    CHD1_CHC1_CHB1_CHA1_FB3_CNT1_Offset: 0xc0,
    // Feedback rate in fractions of 2*Pi, normalized to (0,1):
    // 0, Pi/16, Pi/8, Pi/4, Pi/2, Pi, 2*Pi, 4*Pi turns to be:
    feedback: [0, 1/32, 1/16, 1/8, 1/4, 1/2, 1, 2]
};

var OperatorData = {
    AM1_VIB1_EGT1_KSR1_MULT4_Offset: 0x20,
    KSL2_TL6_Offset: 0x40,
    AR4_DR4_Offset: 0x60,
    SL4_RR4_Offset: 0x80,
    _5_WS3_Offset: 0xe0,
    NO_MODULATION: 'NO_MODULATION',
    CARRIER: 'CARRIER',
    FEEDBACK: 'FEEDBACK',
    waveLength: 1024,
    multTable: [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15],
    ksl3dBtable: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, -3, -6, -9],
        [0, 0, 0, 0, -3, -6, -9, -12],
        [0, 0, 0, -1.875, -4.875, -7.875, -10.875, -13.875],

        [0, 0, 0, -3, -6, -9, -12, -15],
        [0, 0, -1.125, -4.125, -7.125, -10.125, -13.125, -16.125],
        [0, 0, -1.875, -4.875, -7.875, -10.875, -13.875, -16.875],
        [0, 0, -2.625, -5.625, -8.625, -11.625, -14.625, -17.625],

        [0, 0, -3, -6, -9, -12, -15, -18],
        [0, -0.750, -3.750, -6.750, -9.750, -12.750, -15.750, -18.750],
        [0, -1.125, -4.125, -7.125, -10.125, -13.125, -16.125, -19.125],
        [0, -1.500, -4.500, -7.500, -10.500, -13.500, -16.500, -19.500],

        [0, -1.875, -4.875, -7.875, -10.875, -13.875, -16.875, -19.875],
        [0, -2.250, -5.250, -8.250, -11.250, -14.250, -17.250, -20.250],
        [0, -2.625, -5.625, -8.625, -11.625, -14.625, -17.625, -20.625],
        [0, -3, -6, -9, -12, -15, -18, -21]
    ],
    waveforms: [
        new Float64Array(1024), new Float64Array(1024), new Float64Array(1024), new Float64Array(1024),
        new Float64Array(1024), new Float64Array(1024), new Float64Array(1024), new Float64Array(1024)
    ],
    loadWaveforms: function(waveforms){
        var i, theta, x;
        // 1st waveform: sinusoid.
        for (i = 0, theta = 0; i < 1024; i++, theta += (2 * Math.PI / 1024)){
            waveforms[0][i] = Math.sin(theta);
        }

        var sineTable = waveforms[0];
        // 2nd: first half of a sinusoid.
        for (i = 0; i < 512; i++){
            waveforms[1][i] = sineTable[i];
            waveforms[1][512 + i] = 0;
        }

        // 3rd: double positive sinusoid.
        for (i = 0; i < 512; i++){
            waveforms[2][i] = waveforms[2][512 + i] = sineTable[i];
        }

        // 4th: first and third quarter of double positive sinusoid.
        for (i = 0; i < 256; i++){
            waveforms[3][i] = waveforms[3][512 + i] = sineTable[i];
            waveforms[3][256 + i] = waveforms[3][768 + i] = 0;
        }

        // 5th: first half with double frequency sinusoid.
        for (i = 0; i < 512; i++){
            waveforms[4][i] = sineTable[i * 2];
            waveforms[4][512 + i] = 0;
        }

        // 6th: first half with double frequency positive sinusoid.
        for (i = 0; i < 256; i++){
            waveforms[5][i] = waveforms[5][256 + i] = sineTable[i * 2];
            waveforms[5][512 + i] = waveforms[5][768 + i] = 0;
        }

        // 7th: square wave
        for (i = 0; i < 512; i++){
            waveforms[6][i] = 1;
            waveforms[6][512 + i] = -1;
        }

        // 8th: exponential
        for (i = 0, x = 0; i < 512; i++, x += (16 / 256)) {
            waveforms[7][i] = Math.pow(2, -x);
            waveforms[7][1023 - i] = -Math.pow(2, -(x + 1 / 16));
        }
    }
};

OperatorData.loadWaveforms(OperatorData.waveforms);

var EnvelopeGeneratorData = {
    // This table is indexed by the value of Operator.ksr
    // and the value of ChannelRegister.keyScaleNumber.
    rateOffset: [
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    ],
    // These attack periods in miliseconds were taken from the YMF278B manual.
    // The attack actual rates range from 0 to 63, with different data for
    // 0%-100% and for 10%-90%:
    attackTimeValuesTable: [
        [Infinity, Infinity], [Infinity, Infinity], [Infinity, Infinity], [Infinity, Infinity],
        [2826.24, 1482.75], [2252.80, 1155.07], [1884.16, 991.23], [1597.44, 868.35],
        [1413.12, 741.38], [1126.40, 577.54], [942.08, 495.62], [798.72, 434.18],
        [706.56, 370.69], [563.20, 288.77], [471.04, 247.81], [399.36, 217.09],

        [353.28, 185.34], [281.60, 144.38], [235.52, 123.90], [199.68, 108.54],
        [176.76, 92.67], [140.80, 72.19], [117.76, 61.95], [99.84, 54.27],
        [88.32, 46.34], [70.40, 36.10], [58.88, 30.98], [49.92, 27.14],
        [44.16, 23.17], [35.20, 18.05], [29.44, 15.49], [24.96, 13.57],

        [22.08, 11.58], [17.60, 9.02], [14.72, 7.74], [12.48, 6.78],
        [11.04, 5.79], [8.80, 4.51], [7.36, 3.87], [6.24, 3.39],
        [5.52, 2.90], [4.40, 2.26], [3.68, 1.94], [3.12, 1.70],
        [2.76, 1.45], [2.20, 1.13], [1.84, 0.97], [1.56, 0.85],

        [1.40, 0.73], [1.12, 0.61], [0.92, 0.49], [0.80, 0.43],
        [0.70, 0.37], [0.56, 0.31], [0.46, 0.26], [0.42, 0.22],
        [0.38, 0.19], [0.30, 0.14], [0.24, 0.11], [0.20, 0.11],
        [0.00, 0.00], [0.00, 0.00], [0.00, 0.00], [0.00, 0.00]
    ],
    // These decay and release periods in miliseconds were taken from the YMF278B manual.
    // The rate index range from 0 to 63, with different data for
    // 0%-100% and for 10%-90%:
    decayAndReleaseTimeValuesTable: [
        [Infinity, Infinity],    [Infinity, Infinity],    [Infinity, Infinity],    [Infinity, Infinity],
        [39280.64, 8212.48], [31416.32, 6574.08], [26173.44, 5509.12], [22446.08, 4730.88],
        [19640.32, 4106.24], [15708.16, 3287.04], [13086.72, 2754.56], [11223.04, 2365.44],
        [9820.16, 2053.12], [7854.08, 1643.52], [6543.36, 1377.28], [5611.52, 1182.72],

        [4910.08, 1026.56], [3927.04, 821.76], [3271.68, 688.64], [2805.76, 591.36],
        [2455.04, 513.28], [1936.52, 410.88], [1635.84, 344.34], [1402.88, 295.68],
        [1227.52, 256.64], [981.76, 205.44], [817.92, 172.16], [701.44, 147.84],
        [613.76, 128.32], [490.88, 102.72], [488.96, 86.08], [350.72, 73.92],

        [306.88, 64.16], [245.44, 51.36], [204.48, 43.04], [175.36, 36.96],
        [153.44, 32.08], [122.72, 25.68], [102.24, 21.52], [87.68, 18.48],
        [76.72, 16.04], [61.36, 12.84], [51.12, 10.76], [43.84, 9.24],
        [38.36, 8.02], [30.68, 6.42], [25.56, 5.38], [21.92, 4.62],

        [19.20, 4.02], [15.36, 3.22], [12.80, 2.68], [10.96, 2.32],
        [9.60, 2.02], [7.68, 1.62], [6.40, 1.35], [5.48, 1.15],
        [4.80, 1.01], [3.84, 0.81], [3.20, 0.69], [2.74, 0.58],
        [2.40, 0.51], [2.40, 0.51], [2.40, 0.51], [2.40, 0.51]
    ]
};

},{"extend":10,"util":44}],4:[function(_dereq_,module,exports){
(function (process,Buffer,setImmediate){
var Readable = _dereq_('stream').Readable;
var util = _dereq_('util');
var WritableStreamBuffer = _dereq_('stream-buffers').WritableStreamBuffer;
_dereq_('setimmediate');

var OPL3 = _dereq_('./opl3');
var Normalizer = _dereq_('pcm-normalizer');

var currentScriptSrc = null;
try{
    currentScriptSrc = document.currentScript.src;
}catch(err){}

function Player(format, options){
    Readable.call(this);
    options = options || {};
    var self = this;

    var initNormalizer = function(){
        if (options.normalization){
            self.normalizer = new Normalizer(options.bitDepth || 16);
            self.pipe(self.normalizer);

            self.normalizer.on('normalization', function(value){
                self.emit('normalization', value);
            });
            self.normalizer.on('gain', function(value){
                self.emit('gain', value);
            });
            self.normalizer.on('error', function(err){
                self.emit('error', err);
            });
        }
    };

    var initPostMessage = function(postMessage){
        if (typeof postMessage == 'function'){
            self.on('end', function(){
                postMessage({ cmd: 'end' });
            });
            self.on('progress', function(value){
                postMessage({ cmd: 'progress', value: value });
            });
            self.on('error', function(err){
                throw err;
            });
            self.on('midi', function(midi){
                postMessage({ cmd: 'midi', value: midi }, [midi]);
            });

            if (options.normalization){
                self.normalizer.on('normalization', function(value){
                    postMessage({ cmd: 'normalization', value: value });
                });
                self.normalizer.on('gain', function(value){
                    postMessage({ cmd: 'gain', value: value });
                });
                self.normalizer.on('data', function(chunk){
                    postMessage({ cmd: 'data', value: chunk.buffer }, [chunk.buffer]);
                });
            }else{
                self.on('data', function(chunk){
                    postMessage({ cmd: 'data', value: chunk.buffer }, [chunk.buffer]);
                });
            }
        }
    };
    var load = function(buffer, callback, postMessage){
        return new Promise(function(resolve, reject){
            try{
                var bufferWriter = new WritableStreamBuffer({
                    initialSize: (1024 * 1024),
                    incrementAmount: (512 * 1024)
                });

                var onEnd = function(){
                    var pcmBuffer = bufferWriter.getContents().buffer;
                    if (typeof callback == 'function') callback(null, pcmBuffer);
                    resolve(pcmBuffer);
                    options.prebuffer = -1;
                };
                
                if (options.normalization){
                    self.normalizer.pipe(bufferWriter);
                    self.normalizer.on('end', onEnd);
                }else{
                    self.pipe(bufferWriter);
                    self.on('end', onEnd);
                }

                self.on('error', reject);

                if (buffer instanceof ArrayBuffer) buffer = new Buffer(buffer);
                initPostMessage(postMessage);
                
                var player = new format(new OPL3(), options);
                player.load(buffer);

                var aborted = false;
                self.abort = function(){
                    self.emit('abort');
                    aborted = true;
                };
                
                var samplesBuffer = null;
                var bufferType = options.bitDepth == 32 ? Float32Array : Int16Array;
                if (options.bufferSize){
                    samplesBuffer = new bufferType(options.bufferSize * 2);
                }
                var sampleRate = 49700 * ((options.sampleRate || 49700) / 49700);
                var fn = function(){
                    if (aborted) return;

                    var start = Date.now();
                    while (player.update()){
                        if (aborted) return;

                        var d = player.refresh();
                        var n = 4 * ((sampleRate * d) | 0);

                        self.emit('progress', Math.floor(player.position / player.data.byteLength * 1000) / 10);

                        var chunkSize = (n / 2) | 0;
                        if (options.bufferSize){
                            while(chunkSize > 0){
                                var samplesSize = Math.min(options.bufferSize * 2, chunkSize);
                                chunkSize -= samplesSize;

                                player.opl.read(samplesBuffer);

                                self.emit('data', new Buffer(samplesBuffer.buffer));
                                samplesBuffer = new bufferType(options.bufferSize * 2);
                            }
                        }else{
                            var buffer = new bufferType(chunkSize);
                            player.opl.read(buffer);
                            self.emit('data', new Buffer(buffer.buffer));
                        }
                        
                        if (Date.now() - start > 1000) return setImmediate(fn);
                    }

                    self.emit('progress', 100);
                    if (player.midiBuffer) self.emit('midi', new Buffer(player.midiBuffer, 'binary').buffer);
                    self.emit('end');
                };
                
                fn();
            }catch(err){
                self.emit('error', err);
                if (typeof callback == 'function') callback(err, null);
                reject(err);
            }
        });
    };
 
    options.prebuffer = options.prebuffer || 200;
    if (typeof AudioContext != 'undefined'){
        var context = new AudioContext();
        var source = context.createBufferSource();
        var processor = context.createScriptProcessor(2048, 0, 2);
        var gain = context.createGain();
        gain.gain.value = options.volume || 1;
        var queue = [];

        var bufferLeft, bufferRight, silence, queuePos, bufferPerMs;
        var audioQueueFn = function(e){
            var outputBuffer = e.outputBuffer;

            if (self.length >= options.prebuffer){
                for (var i = 0; i < processor.bufferSize / options.bufferSize; i++){
                    var tmp = queue[queuePos];
                    if (tmp){
                        queuePos++;
                        self.emit('position', self.position);
                        var dv = new DataView(tmp.buffer || tmp);
                        for (var j = 0, offset = 0; j < options.bufferSize; j++, offset += 8){
                            bufferLeft[j] = dv.getFloat32(offset, true);
                            bufferRight[j] = dv.getFloat32(offset + 4, true);
                        }
                    }else{
                        bufferLeft.set(silence);
                        bufferRight.set(silence);
                    }

                    outputBuffer.copyToChannel(bufferLeft, 0, i * options.bufferSize);
                    outputBuffer.copyToChannel(bufferRight, 1, i * options.bufferSize);
                }
            }
        };
        var backupQueue = null;

        var isPlayInit = false;
        this.play = function(buffer){
            if (!isPlayInit){
                options.bufferSize = options.bufferSize || 64;
                options.sampleRate = context.sampleRate;
                options.bitDepth = 32;

                bufferLeft = new Float32Array(options.bufferSize);
                bufferRight = new Float32Array(options.bufferSize);
                silence = new Float32Array(options.bufferSize);
                queuePos = 0;

                bufferPerMs = (options.sampleRate / 1000) / options.bufferSize;

                self.load(buffer);
                self.on('data', function(buffer){
                    if (backupQueue) backupQueue.push(buffer);
                    else queue.push(buffer);
                });

                processor.onaudioprocess = audioQueueFn;
                source.connect(processor);
                processor.connect(gain);
                gain.connect(context.destination);
                source.start();

                isPlayInit = true;
            }

            if (backupQueue){
                queue = backupQueue;
                backupQueue = null;
            }
        };
        this.pause = function(){
            backupQueue = queue;
            queue = [];
        };
        this.on('abort', this.pause);

        this.seek = function(ms){
            queuePos = Math.floor(ms * bufferPerMs);
        };
        Object.defineProperty(this, 'position', {
            get: function(){ return Math.floor(queuePos / bufferPerMs); }
        });
        Object.defineProperty(this, 'length', {
            get: function(){ return Math.floor((backupQueue || queue).length / bufferPerMs); }
        });
        Object.defineProperty(this, 'volume', {
            get: function(){ return gain.gain.value; },
            set: function(value){ gain.gain.value = value; }
        });
    }

    if (!options.disableWorker && process.browser && typeof window != 'undefined' && 'Worker' in window){
        try{
            this.load = function(buffer, callback, postMessage){
                initPostMessage(postMessage);

                var formatName = format.name;
                var workerSrc = [
                    'importScripts("' + currentScriptSrc + '");',
                    'onmessage = function(msg){',
                    '   var player = new OPL3.Player(OPL3.format.' + formatName + ', msg.data.options);',
                    '   player.load(msg.data.buffer, function(err, buffer){',
                    '       if (err) throw err;',
                    '       postMessage({ cmd: "callback", value: buffer }, [buffer]);',
                    '   }, postMessage);',
                    '};'
                ].join('\n');

                var blob;
                try{
                    blob = new Blob([workerSrc], {type: 'application/javascript'});
                }catch (e) { // Backwards-compatibility
                    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                    blob = new BlobBuilder();
                    blob.append(workerSrc);
                    blob = blob.getBlob();
                }
                var worker = new Worker(URL.createObjectURL(blob));
                worker.onmessage = function(msg){
                    self.emit(msg.data.cmd, msg.data.value);
                    if (msg.data.cmd == 'callback'){
                        if (typeof callback == 'function') callback(null, msg.data.value);
                        worker.terminate();
                    }
                };
                worker.onerror = function(err){
                    self.emit('error', err);
                    if (typeof callback == 'function') callback(err, null);
                };
                self.abort = function(){
                    worker.terminate();
                    self.emit('abort');
                };

                worker.postMessage({ buffer: buffer, options: options }, [buffer]);
            };
        }catch(err){
            console.warn('OPL3 WebWorker not supported! :(');
            options.prebuffer = Infinity;
            initNormalizer();
            this.load = load;
        }
    }else{
        options.prebuffer = Infinity;
        initNormalizer();
        this.load = load;
    }

    this._read = function(){};
}

util.inherits(Player, Readable);
module.exports = Player;
}).call(this,_dereq_('_process'),_dereq_("buffer").Buffer,_dereq_("timers").setImmediate)
},{"./opl3":3,"_process":18,"buffer":7,"pcm-normalizer":16,"setimmediate":33,"stream":34,"stream-buffers":37,"timers":40,"util":44}],5:[function(_dereq_,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],6:[function(_dereq_,module,exports){

},{}],7:[function(_dereq_,module,exports){
(function (global,Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = _dereq_('base64-js')
var ieee754 = _dereq_('ieee754')
var isArray = _dereq_('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer)
},{"base64-js":5,"buffer":7,"ieee754":11,"isarray":14}],8:[function(_dereq_,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":_dereq_("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":13}],9:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],10:[function(_dereq_,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
var setProperty = function setProperty(target, options) {
	if (defineProperty && options.name === '__proto__') {
		defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
	} else {
		target[options.name] = options.newValue;
	}
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
var getProperty = function getProperty(obj, name) {
	if (name === '__proto__') {
		if (!hasOwn.call(obj, name)) {
			return void 0;
		} else if (gOPD) {
			// In early versions of node, obj['__proto__'] is buggy when obj has
			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
			return gOPD(obj, name).value;
		}
	}

	return obj[name];
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						setProperty(target, { name: name, newValue: copy });
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],11:[function(_dereq_,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],13:[function(_dereq_,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],14:[function(_dereq_,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],15:[function(_dereq_,module,exports){
(function (Buffer){
var Transform = _dereq_('stream').Transform;
var util = _dereq_('util');

function From16To32Bit(){
    Transform.call(this);
}

From16To32Bit.prototype._transform = function(chunk, encoding, done){
    var b32 = new Float32Array(chunk.byteLength / 2);
    var dv = new DataView(chunk.buffer);
    for (var i = 0, offset = 0; offset < chunk.byteLength; i++, offset += 2){
        var v = dv.getInt16(offset, true);
        b32[i] = v > 0 ? v / 32767 : v / 32768;
    }
    done(null, new Buffer(b32.buffer));
};

util.inherits(From16To32Bit, Transform);
module.exports.From16To32Bit = From16To32Bit;

function From32To16Bit(){
    Transform.call(this);
}

From32To16Bit.prototype._transform = function(chunk, encoding, done){
    var b16 = new Int16Array(chunk.byteLength / 4);
    var dv = new DataView(chunk.buffer);
    for (var i = 0, offset = 0; offset < chunk.byteLength; i++, offset += 4){
        var v = dv.getFloat32(offset, true);
        b16[i] = v > 0 ? v * 32767 : v * 32768;
    }
    done(null, new Buffer(b16.buffer));
};

util.inherits(From32To16Bit, Transform);
module.exports.From32To16Bit = From32To16Bit;
}).call(this,_dereq_("buffer").Buffer)
},{"buffer":7,"stream":34,"util":44}],16:[function(_dereq_,module,exports){
(function (setImmediate){
var Transform = _dereq_('stream').Transform;
var WritableStreamBuffer = _dereq_('stream-buffers').WritableStreamBuffer;
var util = _dereq_('util');

function Normalizer(bitDepth){
    if (typeof bitDepth != 'undefined' && !(bitDepth == 16 || bitDepth == 32)) throw new Error('Unsupported bit depth');

    Transform.call(this);
    var self = this;

    var WritableStreamBuffer = _dereq_('stream-buffers').WritableStreamBuffer;
    var writer = new WritableStreamBuffer({
        initialSize: (1024 * 1024),
        incrementAmount: (512 * 1024)
    });

    var peak = 0;
    var scale = 1;
    var targetPeak = (bitDepth == 32 ? 1 : 32767);
    var len = 0;

    var bps = (bitDepth == 32 ? 4 : 2);
    var getter = (bitDepth == 32 ? DataView.prototype.getFloat32 : DataView.prototype.getInt16);
    var setter = (bitDepth == 32 ? DataView.prototype.setFloat32 : DataView.prototype.setInt16);

    this._transform = function(chunk, encoding, done){
        var dv = new DataView(chunk.buffer);
        len += chunk.byteLength / bps;

        for (var i = 0; i < chunk.byteLength; i += bps){
            var p = Math.abs(getter.call(dv, i, true));
            if (p > peak) peak = p;
        }

        writer.write(chunk);
        done();
    };

    this._flush = function(done){
        writer.end();
        var pcmBuffer = writer.getContents();

        var endFn = function(){
            self.push(pcmBuffer);
            done();
        };

        if (peak > 0){
            scale = targetPeak / peak;
            var dv = new DataView(pcmBuffer.buffer);

            var i = 0;
            var perc = 0;
            var normPcm = function(){
                var t = Date.now();

                for (; i < pcmBuffer.byteLength; i += bps){
                    setter.call(dv, i, Math.round(getter.call(dv, i, true) * scale), true);
                    var p = Math.floor((i / pcmBuffer.byteLength) * 1000) / 10;
                    if (p > perc){
                        perc = p;
                        self.emit('normalization', perc);
                    }
                    if (Date.now() - t > 1000) return setImmediate(normPcm);
                }

                self.emit('normalization', 100);
                self.emit('gain', scale);
                endFn();
            };
            normPcm();
        }else endFn();
    };
}

util.inherits(Normalizer, Transform);
module.exports = Normalizer;
}).call(this,_dereq_("timers").setImmediate)
},{"stream":34,"stream-buffers":37,"timers":40,"util":44}],17:[function(_dereq_,module,exports){
(function (process){
'use strict';

if (typeof process === 'undefined' ||
    !process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,_dereq_('_process'))
},{"_process":18}],18:[function(_dereq_,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],19:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":20}],20:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = Object.create(_dereq_('core-util-is'));
util.inherits = _dereq_('inherits');
/*</replacement>*/

var Readable = _dereq_('./_stream_readable');
var Writable = _dereq_('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":22,"./_stream_writable":24,"core-util-is":8,"inherits":12,"process-nextick-args":17}],21:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = _dereq_('./_stream_transform');

/*<replacement>*/
var util = Object.create(_dereq_('core-util-is'));
util.inherits = _dereq_('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":23,"core-util-is":8,"inherits":12}],22:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = _dereq_('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = _dereq_('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = Object.create(_dereq_('core-util-is'));
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = _dereq_('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = _dereq_('./internal/streams/BufferList');
var destroyImpl = _dereq_('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":20,"./internal/streams/BufferList":25,"./internal/streams/destroy":26,"./internal/streams/stream":27,"_process":18,"core-util-is":8,"events":9,"inherits":12,"isarray":14,"process-nextick-args":17,"safe-buffer":32,"string_decoder/":39,"util":6}],23:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = _dereq_('./_stream_duplex');

/*<replacement>*/
var util = Object.create(_dereq_('core-util-is'));
util.inherits = _dereq_('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":20,"core-util-is":8,"inherits":12}],24:[function(_dereq_,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = Object.create(_dereq_('core-util-is'));
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: _dereq_('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = _dereq_('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("timers").setImmediate)
},{"./_stream_duplex":20,"./internal/streams/destroy":26,"./internal/streams/stream":27,"_process":18,"core-util-is":8,"inherits":12,"process-nextick-args":17,"safe-buffer":32,"timers":40,"util-deprecate":41}],25:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = _dereq_('safe-buffer').Buffer;
var util = _dereq_('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":32,"util":6}],26:[function(_dereq_,module,exports){
'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":17}],27:[function(_dereq_,module,exports){
module.exports = _dereq_('events').EventEmitter;

},{"events":9}],28:[function(_dereq_,module,exports){
module.exports = _dereq_('./readable').PassThrough

},{"./readable":29}],29:[function(_dereq_,module,exports){
exports = module.exports = _dereq_('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = _dereq_('./lib/_stream_writable.js');
exports.Duplex = _dereq_('./lib/_stream_duplex.js');
exports.Transform = _dereq_('./lib/_stream_transform.js');
exports.PassThrough = _dereq_('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":20,"./lib/_stream_passthrough.js":21,"./lib/_stream_readable.js":22,"./lib/_stream_transform.js":23,"./lib/_stream_writable.js":24}],30:[function(_dereq_,module,exports){
module.exports = _dereq_('./readable').Transform

},{"./readable":29}],31:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":24}],32:[function(_dereq_,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = _dereq_('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":7}],33:[function(_dereq_,module,exports){
(function (process,global){
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":18}],34:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = _dereq_('events').EventEmitter;
var inherits = _dereq_('inherits');

inherits(Stream, EE);
Stream.Readable = _dereq_('readable-stream/readable.js');
Stream.Writable = _dereq_('readable-stream/writable.js');
Stream.Duplex = _dereq_('readable-stream/duplex.js');
Stream.Transform = _dereq_('readable-stream/transform.js');
Stream.PassThrough = _dereq_('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":9,"inherits":12,"readable-stream/duplex.js":19,"readable-stream/passthrough.js":28,"readable-stream/readable.js":29,"readable-stream/transform.js":30,"readable-stream/writable.js":31}],35:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  DEFAULT_INITIAL_SIZE: (8 * 1024),
  DEFAULT_INCREMENT_AMOUNT: (8 * 1024),
  DEFAULT_FREQUENCY: 1,
  DEFAULT_CHUNK_SIZE: 1024
};

},{}],36:[function(_dereq_,module,exports){
(function (Buffer){
'use strict';

var stream = _dereq_('stream');
var constants = _dereq_('./constants');
var util = _dereq_('util');

var ReadableStreamBuffer = module.exports = function(opts) {
  var that = this;
  opts = opts || {};

  stream.Readable.call(this, opts);

  this.stopped = false;

  var frequency = opts.hasOwnProperty('frequency') ? opts.frequency : constants.DEFAULT_FREQUENCY;
  var chunkSize = opts.chunkSize || constants.DEFAULT_CHUNK_SIZE;
  var initialSize = opts.initialSize || constants.DEFAULT_INITIAL_SIZE;
  var incrementAmount = opts.incrementAmount || constants.DEFAULT_INCREMENT_AMOUNT;

  var size = 0;
  var buffer = new Buffer(initialSize);
  var allowPush = false;

  var sendData = function() {
    var amount = Math.min(chunkSize, size);
    var sendMore = false;

    if (amount > 0) {
      var chunk = null;
      chunk = new Buffer(amount);
      buffer.copy(chunk, 0, 0, amount);

      sendMore = that.push(chunk) !== false;
      allowPush = sendMore;

      buffer.copy(buffer, 0, amount, size);
      size -= amount;
    }

    if(size === 0 && that.stopped) {
      that.push(null);
    }

    if (sendMore) {
      sendData.timeout = setTimeout(sendData, frequency);
    }
    else {
      sendData.timeout = null;
    }
  };

  this.stop = function() {
    if (this.stopped) {
      throw new Error('stop() called on already stopped ReadableStreamBuffer');
    }
    this.stopped = true;

    if (size === 0) {
      this.push(null);
    }
  };

  this.size = function() {
    return size;
  };

  this.maxSize = function() {
    return buffer.length;
  };

  var increaseBufferIfNecessary = function(incomingDataSize) {
    if((buffer.length - size) < incomingDataSize) {
      var factor = Math.ceil((incomingDataSize - (buffer.length - size)) / incrementAmount);

      var newBuffer = new Buffer(buffer.length + (incrementAmount * factor));
      buffer.copy(newBuffer, 0, 0, size);
      buffer = newBuffer;
    }
  };

  var kickSendDataTask = function () {
    if (!sendData.timeout && allowPush) {
      sendData.timeout = setTimeout(sendData, frequency);
    }
  }

  this.put = function(data, encoding) {
    if (that.stopped) {
      throw new Error('Tried to write data to a stopped ReadableStreamBuffer');
    }

    if(Buffer.isBuffer(data)) {
      increaseBufferIfNecessary(data.length);
      data.copy(buffer, size, 0);
      size += data.length;
    }
    else {
      data = data + '';
      var dataSizeInBytes = Buffer.byteLength(data);
      increaseBufferIfNecessary(dataSizeInBytes);
      buffer.write(data, size, encoding || 'utf8');
      size += dataSizeInBytes;
    }

    kickSendDataTask();
  };

  this._read = function() {
    allowPush = true;
    kickSendDataTask();
  };
};

util.inherits(ReadableStreamBuffer, stream.Readable);

}).call(this,_dereq_("buffer").Buffer)
},{"./constants":35,"buffer":7,"stream":34,"util":44}],37:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./constants');
module.exports.ReadableStreamBuffer = _dereq_('./readable_streambuffer');
module.exports.WritableStreamBuffer = _dereq_('./writable_streambuffer');

},{"./constants":35,"./readable_streambuffer":36,"./writable_streambuffer":38}],38:[function(_dereq_,module,exports){
(function (Buffer){
'use strict';

var util = _dereq_('util');
var stream = _dereq_('stream');
var constants = _dereq_('./constants');

var WritableStreamBuffer = module.exports = function(opts) {
  opts = opts || {};
  opts.decodeStrings = true;

  stream.Writable.call(this, opts);

  var initialSize = opts.initialSize || constants.DEFAULT_INITIAL_SIZE;
  var incrementAmount = opts.incrementAmount || constants.DEFAULT_INCREMENT_AMOUNT;

  var buffer = new Buffer(initialSize);
  var size = 0;

  this.size = function() {
    return size;
  };

  this.maxSize = function() {
    return buffer.length;
  };

  this.getContents = function(length) {
    if(!size) return false;

    var data = new Buffer(Math.min(length || size, size));
    buffer.copy(data, 0, 0, data.length);

    if(data.length < size)
      buffer.copy(buffer, 0, data.length);

    size -= data.length;

    return data;
  };

  this.getContentsAsString = function(encoding, length) {
    if(!size) return false;

    var data = buffer.toString(encoding || 'utf8', 0, Math.min(length || size, size));
    var dataLength = Buffer.byteLength(data);

    if(dataLength < size)
      buffer.copy(buffer, 0, dataLength);

    size -= dataLength;
    return data;
  };

  var increaseBufferIfNecessary = function(incomingDataSize) {
    if((buffer.length - size) < incomingDataSize) {
      var factor = Math.ceil((incomingDataSize - (buffer.length - size)) / incrementAmount);

      var newBuffer = new Buffer(buffer.length + (incrementAmount * factor));
      buffer.copy(newBuffer, 0, 0, size);
      buffer = newBuffer;
    }
  };

  this._write = function(chunk, encoding, callback) {
    increaseBufferIfNecessary(chunk.length);
    chunk.copy(buffer, size, 0);
    size += chunk.length;
    callback();
  };
};

util.inherits(WritableStreamBuffer, stream.Writable);

}).call(this,_dereq_("buffer").Buffer)
},{"./constants":35,"buffer":7,"stream":34,"util":44}],39:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":32}],40:[function(_dereq_,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = _dereq_('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,_dereq_("timers").setImmediate,_dereq_("timers").clearImmediate)
},{"process/browser.js":18,"timers":40}],41:[function(_dereq_,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],42:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],43:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],44:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":43,"_process":18,"inherits":42}],45:[function(_dereq_,module,exports){
(function (Buffer){
var markers = {
    RIFF: new Buffer('RIFF'),
    WAVE: new Buffer('WAVE'),
    fmt: new Buffer('fmt '),
    data: new Buffer('data')
};

function WAV(data, options){
    options = options || {};
    var sampleRate = options.sampleRate || 44100;
    var bitDepth = options.bitDepth || 32;
    var channels = options.channels || 2;

    data = new Buffer(data.buffer || data);
    var output = new Buffer(data.byteLength + 44);
    var dv = new DataView(output.buffer);

    var blockAlign = (channels * bitDepth) >> 3;
    var byteRate = blockAlign * sampleRate;
    var subChunk2Size = (data.byteLength / (bitDepth == 32 ? 4 : 2)) * channels * (bitDepth >> 3);
    var chunkSize = 36 + subChunk2Size;

    output.set(markers.RIFF, 0);
    dv.setUint32(4, chunkSize, true);
    output.set(markers.WAVE, 8);
    output.set(markers.fmt, 12);
    dv.setUint32(16, 16, true);
    dv.setUint16(20, bitDepth == 32 ? 3 : 1, true);
    dv.setUint16(22, channels, true);
    dv.setUint32(24, sampleRate, true);
    dv.setUint32(28, byteRate, true);
    dv.setUint16(32, blockAlign, true);
    dv.setUint16(34, bitDepth, true);
    output.set(markers.data, 36);
    dv.setUint32(40, subChunk2Size, true);
    output.set(data, 44);

	return output.buffer;
}

module.exports = WAV;
}).call(this,_dereq_("buffer").Buffer)
},{"buffer":7}]},{},[2])(2)
});
