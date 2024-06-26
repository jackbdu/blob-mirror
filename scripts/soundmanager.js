class SoundManager {
  constructor(tone) {
    this.Tone = tone ?? Tone;
    this.loaded = false;
    this.started = false;
    this.maxVolume = 0;
    this.melodyMidiIndex = 0;

    this.mode = 0;
    this.modeThreshold = 0;
    this._latestStartTime = 0;
  }

  preload(options) {
    this.Tone.loaded().then(() => {
      this.loaded = true;
    });
  }

  setup(options) {
    const meterOptions = options?.meter ?? {};
    const rhythmSynthsOptions = options?.rhythmSynths ?? {};
    const melodySynthsOptions = options?.melodySynths ?? {};
    const chordSynthsOptions = options?.chordSynths ?? {};
    const interval = options?.interval ?? "8n";
    const timeSignature = options?.timeSignature ?? 4;

    this.bpm = options?.bpm ?? 120;
    this.maxBpm = options?.maxBpm ?? 300;
    this.destBpm = this.bpm;
    this.bpmDiffAmplitude = options?.bpmDiffAmplitude ?? 20;
    this.rhythmSequence = options?.rhythmSequence ?? [];
    this.rhythmFrequency = options?.rhythmFrequency ?? 200;
    this.melodyCenterMidi = options?.melodyCenterMidi ?? 60;
    this.chordCenterMidi = options?.chordCenterMidi ?? 50;
    this.chordMidiArrayOffsets = options?.chordMidiArrayOffsets ?? [0, 2, 4, 6];
    this.minMidi = options?.minMidi ?? 0;
    this.maxMidi = options?.maxMidi ?? 127;
    this.horizontalSemitonesNum = options?.horizontalSemitonesNum ?? 12;
    this.verticalSemitonesNum = options?.verticalSemitonesNum ?? 12;
    this.modeThresholdHysteresis = options?.modeThresholdHysteresis ?? 0.02;

    // rhythm
    this.rhythmSynths = [];
    this.rhythmMeter = new this.Tone.Meter(meterOptions);
    for (let i = 0; i < rhythmSynthsOptions.length; i++) {
      const rhythmSynthOptions = rhythmSynthsOptions[i];
      const rhythmSynthType = rhythmSynthOptions.type ?? "MembraneSynth";
      if (rhythmSynthOptions.volume && rhythmSynthOptions.volume > this.maxVolume) {
        rhythmSynthOptions.volume = this.maxVolume;
      }
      this.rhythmSynths[i] = new this.Tone[rhythmSynthType](rhythmSynthOptions).toDestination();
      this.rhythmSynths[i].connect(this.rhythmMeter);
    }

    // melody
    this.melodySynths = [];
    this.melodyMeter = new this.Tone.Meter(meterOptions);
    for (let i = 0; i < melodySynthsOptions.length; i++) {
      const melodySynthOptions = melodySynthsOptions[i];
      if (melodySynthOptions.volume && melodySynthOptions.volume > this.maxVolume) {
        melodySynthOptions.volume = this.maxVolume;
      }
      this.melodySynths[i] = new this.Tone.FMSynth(melodySynthOptions).toDestination();
      this.melodySynths[i].connect(this.melodyMeter);
    }
    this.melodyMidis = [];

    // chord
    this.chordSynths = [];
    this.chordMeter = new this.Tone.Meter(meterOptions);
    for (let i = 0; i < chordSynthsOptions.length; i++) {
      const chordSynthOptions = chordSynthsOptions[i];
      if (chordSynthOptions.volume && chordSynthOptions.volume > this.maxVolume) {
        chordSynthOptions.volume = this.maxVolume;
      }
      this.chordSynths[i] = new this.Tone.PolySynth(this.Tone.FMSynth, chordSynthOptions).toDestination();
      this.chordSynths[i].connect(this.chordMeter);
    }
    this.chordMidis = [];

    this.Tone.Transport.bpm.value = this.bpm;
    this.Tone.Transport.timeSignature = timeSignature;
    this.Tone.Transport.scheduleRepeat((time) => {
      if (this.destBpm !== this.Tone.Transport.bpm.value) {
        const rampTime = this.smoothness;
        this.Tone.Transport.bpm.rampTo(this.destBpm, rampTime, this.latestStartTime);
        //console.log(this.Tone.Transport.bpm.value);
      }

      const barsBeatsSixteens = this.Tone.Transport.position.split(":");
      const bar = parseInt(barsBeatsSixteens[0]);
      const beat = parseInt(barsBeatsSixteens[1]);

      const intervalDuration = this.Tone.Time(interval);

      const beatCount = bar * timeSignature + beat;
      const rhythmSequenceIndex = beatCount % this.rhythmSequence.length;
      const activeRhythmSynthIndices = this.rhythmSequence[rhythmSequenceIndex];
      for (const index of activeRhythmSynthIndices) {
        this.rhythmSynths[index].triggerAttackRelease(this.rhythmFrequency, intervalDuration, this.latestStartTime);
      }

      // play melody
      if (this.melodyMidis.length) {
        //this.melodyMidiIndex = ((bar % 2) * 2 + Math.floor(beat / 2)) % this.melodyMidis.length;
        this.melodyMidiIndex = (this.melodyMidiIndex + 1) % this.melodyMidis.length;
        const melodyMidi = this.melodyMidis[this.melodyMidiIndex];
        const melodyNote = this.Tone.Frequency(melodyMidi, "midi");
        const melodyNoteDuration = intervalDuration;
        this.melodySynths[this.mode % this.melodySynths.length].triggerAttackRelease(melodyNote, melodyNoteDuration, this.latestStartTime);
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
        this.chordSynths[this.mode % this.chordSynths.length].triggerAttackRelease(chordNotes, chordNoteDuration, this.latestStartTime);
      }
    }, interval);
  }

  // manually managing time to avoid fatal error
  get latestStartTime() {
    const now = this.Tone.now();
    if (this._latestStartTime < now) {
      this._latestStartTime = now;
    } else {
      this._latestStartTime += 0.001;
    }
    return this._latestStartTime;
  }

  // [ ] Use object as input?
  update(categorizedCoords, relativeAverageCoord, bpmDiffFactor) {
    this.destBpm = Math.floor(this.bpm + this.bpmDiffAmplitude * bpmDiffFactor);
    this.destBpm = Math.min(this.maxBpm, this.destBpm);
    this.categorizedCoords = categorizedCoords;

    if (this.mode === 1 && relativeAverageCoord.x < this.modeThreshold - this.modeThresholdHysteresis) {
      this.mode = 0;
    } else if (this.mode !== 1 && relativeAverageCoord.x > this.modeThreshold + this.modeThresholdHysteresis) {
      this.mode = 1;
    }

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
            coordValueArray.push(this.getRhythmMeterValue());
            coordValueArray.push(0);
          } else if (category === "melody" && index === this.melodyMidiIndex) {
            coordValueArray.push(this.getMelodyMeterValue());
            coordValueArray.push(1);
          } else if (category === "chord" && index === this.chordMidiIndex) {
            coordValueArray.push(this.getChordMeterValue());
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

  getChordMeterValue() {
    return this.chordMeter.getValue();
  }

  getBpmValue() {
    return this.Tone.Transport.bpm.value;
  }

  getMode() {
    return this.mode;
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
