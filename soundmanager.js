class SoundManager {
  constructor(tone) {
    this.Tone = tone ?? Tone;
    this.loaded = false;
    this.started = false;
    this.maxVolume = 0;
    this.melodyMidiIndex = 0;
  }

  preload(options) {
    const rhythmPlayersOptions = options?.rhythmPlayers ?? {};
    if (rhythmPlayersOptions.volume && rhythmPlayersOptions.volume > this.maxVolume) {
      rhythmPlayersOptions.volume = this.maxVolume;
    }
    const rhythmUrls = rhythmPlayersOptions.urls ?? {};
    this.rhythmPlayers = new this.Tone.Players(rhythmPlayersOptions);
    this.rhythmNames = Object.keys(rhythmUrls);
    this.Tone.loaded().then(() => {
      this.loaded = true;
    });
  }

  setup(options) {
    const meterOptions = options?.meter ?? {};
    const melodySynthOptions = options?.melodySynth ?? {};
    const chordSynthOptions = options?.chordSynth ?? {};
    const interval = options?.interval ?? "8n";
    const timeSignature = options?.timeSignature ?? 4;

    this.bpm = options?.bpm ?? 120;
    this.destBpm = this.bpm;
    this.bpmDiffAmplitude = options?.bpmDiffAmplitude ?? 20;
    this.melodyCenterMidi = options?.melodyCenterMidi ?? 60;
    this.chordCenterMidi = options?.chordCenterMidi ?? 50;
    this.chordMidiArrayOffsets = options?.chordMidiArrayOffsets ?? [0, 2, 4, 6];
    this.minMidi = options?.minMidi ?? 0;
    this.maxMidi = options?.maxMidi ?? 127;
    this.horizontalSemitonesNum = options?.horizontalSemitonesNum ?? 12;
    this.verticalSemitonesNum = options?.verticalSemitonesNum ?? 12;

    // rhythm
    this.rhythmMeter = new this.Tone.Meter(meterOptions);
    this.rhythmPlayers.toDestination();
    this.rhythmPlayers.connect(this.rhythmMeter);

    // melody
    if (melodySynthOptions.volume && melodySynthOptions.volume > this.maxVolume) {
      melodySynthOptions.volume = this.maxVolume;
    }
    this.melodyMeter = new this.Tone.Meter(meterOptions);
    this.melodySynth = new this.Tone.FMSynth(melodySynthOptions).toDestination();
    this.melodySynth.connect(this.melodyMeter);
    this.melodyMidis = [];

    // chord
    if (chordSynthOptions.volume && chordSynthOptions.volume > this.maxVolume) {
      chordSynthOptions.volume = this.maxVolume;
    }
    this.chordMeter = new this.Tone.Meter(meterOptions);
    this.chordSynth = new this.Tone.PolySynth(this.Tone.FMSynth, chordSynthOptions).toDestination();
    //console.log(this.chordSynth);
    this.chordSynth.connect(this.chordMeter);
    this.chordMidis = [];

    this.Tone.Transport.bpm.value = this.bpm;
    this.Tone.Transport.timeSignature = timeSignature;
    this.Tone.Transport.scheduleRepeat((time) => {
      if (this.destBpm !== this.Tone.Transport.bpm.value) {
        const rampTime = this.smoothness;
        this.Tone.Transport.bpm.rampTo(this.destBpm, rampTime, time);
        console.log(this.Tone.Transport.bpm.value);
      }

      const barsBeatsSixteens = this.Tone.Transport.position.split(":");
      const bar = parseInt(barsBeatsSixteens[0]);
      const beat = parseInt(barsBeatsSixteens[1]);
      // todos
      // [] algorithmically generate beats
      for (let i = 0; i < this.rhythmNames.length; i++) {
        if (bar % i === 0 || beat % 4 === 3) {
          this.rhythmPlayers.player(this.rhythmNames[i]).start(time);
        }
      }
      const intervalDuration = this.Tone.Time(interval);
      // play melody
      if (this.melodyMidis.length) {
        //this.melodyMidiIndex = ((bar % 2) * 2 + Math.floor(beat / 2)) % this.melodyMidis.length;
        this.melodyMidiIndex = (this.melodyMidiIndex + 1) % this.melodyMidis.length;
        const melodyMidi = this.melodyMidis[this.melodyMidiIndex];
        const melodyNote = this.Tone.Frequency(melodyMidi, "midi");
        const melodyNoteDuration = intervalDuration;
        this.melodySynth.triggerAttackRelease(melodyNote, melodyNoteDuration, time);
      }

      // play chord
      // console.log(beat, bar); // does start until second beat because midis are available till second beat
      if (this.chordMidis.length > 0 && beat % timeSignature == 0) {
        this.chordMidiIndex = bar % this.chordMidis.length;
        const chordMidi = this.chordMidis[this.chordMidiIndex];
        const chordMidiArray = this.chordMidiArrayOffsets.map((offset) => chordMidi + offset);
        const chordNotes = chordMidiArray.map((chordMidi) => this.Tone.Frequency(chordMidi, "midi"));
        //console.log(chordMidi);
        const chordNoteDuration = intervalDuration * timeSignature;
        this.chordSynth.triggerAttackRelease(chordNotes, chordNoteDuration, time);
      }
    }, interval);
  }

  update(categorizedCoords, bpmDiffFactor) {
    this.destBpm = Math.floor(this.bpm + this.bpmDiffAmplitude * bpmDiffFactor);
    this.categorizedCoords = categorizedCoords;
    for (const [bodyIndex, bodyCoords] of this.categorizedCoords.entries()) {
      for (const [category, coords] of Object.entries(bodyCoords)) {
        if (category === "melody") {
          for (const [coordIndex, coord] of coords.entries()) {
            const horizontalOffset = Math.round(this.horizontalSemitonesNum * coord.x);
            const verticalOffset = Math.round(this.verticalSemitonesNum * (1 - coord.y));
            const midiValue = this.melodyCenterMidi + horizontalOffset + verticalOffset;
            const constrainedMidiValue = Math.min(Math.max(this.minMidi, midiValue), this.maxMidi);
            const index = bodyIndex * coords.length + coordIndex;
            this.melodyMidis[index] = constrainedMidiValue;
          }
        } else if (category === "chord") {
          for (const [coordIndex, coord] of coords.entries()) {
            const horizontalOffset = Math.round(this.horizontalSemitonesNum * coord.x);
            const verticalOffset = Math.round(this.verticalSemitonesNum * (1 - coord.y));
            const midiValue = this.chordCenterMidi + horizontalOffset + verticalOffset;
            const constrainedMidiValue = Math.min(Math.max(this.minMidi, midiValue), this.maxMidi);
            const index = bodyIndex * coords.length + coordIndex;
            this.chordMidis[index] = constrainedMidiValue;
          }
        }
      }
    }
  }

  getCoordValueArray() {
    const coordValueArray = [];
    for (const [bodyIndex, bodyCoords] of this.categorizedCoords.entries()) {
      for (const [category, coords] of Object.entries(bodyCoords)) {
        for (const [coordIndex, coord] of coords.entries()) {
          const index = bodyIndex * coords.length + coordIndex;
          coordValueArray.push(coord.x);
          coordValueArray.push(coord.y);
          coordValueArray.push(coord.intensity);
          if (category === "rhythm") {
            coordValueArray.push(this.rhythmMeter.getValue());
            coordValueArray.push(0);
          } else if (category === "melody" && index === this.melodyMidiIndex) {
            coordValueArray.push(this.melodyMeter.getValue());
            coordValueArray.push(1);
          } else if (category === "chord" && index === this.chordMidiIndex) {
            coordValueArray.push(this.chordMeter.getValue());
            coordValueArray.push(2);
          } else {
            coordValueArray.push(0);
            coordValueArray.push(3);
          }
        }
      }
    }
    //console.log(coordValueArray.length);
    return coordValueArray;
  }

  getRhythmMeterValue() {
    return this.rhythmMeter.getValue();
  }

  getMelodyMeterValue() {
    return this.melodyMeter.getValue();
  }

  getBpmValue() {
    return this.Tone.Transport.bpm.value;
  }

  mousePressed() {
    // todos
    // [ ] make this autostart for exhibition
    if (this.loaded === true && this.started !== true) {
      this.Tone.start().then(() => {
        this.started = true;
        this.Tone.Transport.start();
      });
    }
  }
}
