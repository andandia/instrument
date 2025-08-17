document.addEventListener('DOMContentLoaded', () => {
    const piano = document.getElementById('piano');
    const loading = document.getElementById('loading');

    const noteMap = {
        'C': 'ド', 'C#': 'ド#', 'D': 'レ', 'D#': 'レ#', 'E': 'ミ', 'F': 'ファ', 'F#': 'ファ#', 'G': 'ソ', 'G#': 'ソ#', 'A': 'ラ', 'A#': 'ラ#', 'B': 'シ'
    };

    const keys = [
        { note: 'C', type: 'white' },
        { note: 'C#', type: 'black' },
        { note: 'D', type: 'white' },
        { note: 'D#', type: 'black' },
        { note: 'E', type: 'white' },
        { note: 'F', type: 'white' },
        { note: 'F#', type: 'black' },
        { note: 'G', type: 'white' },
        { note: 'G#', type: 'black' },
        { note: 'A', type: 'white' },
        { note: 'A#', type: 'black' },
        { note: 'B', type: 'white' }
    ];

    let synthesizer;
    let audioContext;

    async function init() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            synthesizer = new JSSynth.Synthesizer();
            await synthesizer.init(audioContext.sampleRate);

            const response = await fetch('resource/piano.sf2');
            const sf2 = await response.arrayBuffer();
            await synthesizer.loadSFont(sf2);

            loading.style.display = 'none';
        } catch (error) {
            loading.textContent = 'Error loading sounds.';
            console.error('Error initializing synthesizer:', error);
        }
    }

    function noteToMidi(note, octave) {
        const noteIndex = keys.findIndex(k => k.note === note);
        return 12 + (octave * 12) + noteIndex;
    }

    function noteOn(note, octave) {
        if (!synthesizer) return;
        const midiNote = noteToMidi(note, octave);
        synthesizer.noteOn(0, midiNote, 127);
    }

    function noteOff(note, octave) {
        if (!synthesizer) return;
        const midiNote = noteToMidi(note, octave);
        synthesizer.noteOff(0, midiNote);
    }

    function createKey(keyInfo, octave) {
        const keyElement = document.createElement('div');
        const noteName = document.createElement('span');

        keyElement.className = `key ${keyInfo.type}`;
        keyElement.dataset.note = keyInfo.note;
        keyElement.dataset.octave = octave;

        noteName.className = 'note-name';
        noteName.textContent = noteMap[keyInfo.note];
        
        keyElement.appendChild(noteName);
        keyElement.addEventListener('contextmenu', e => e.preventDefault());

        return keyElement;
    }

    function drawPiano() {
        piano.innerHTML = '';
        let whiteKeyCount = 0;

        for (let octave = 1; octave <= 7; octave++) {
            for (const key of keys) {
                const keyElement = createKey(key, octave);
                piano.appendChild(keyElement);

                if (key.type === 'white') {
                    whiteKeyCount++;
                } else {
                    keyElement.style.left = `${(whiteKeyCount - 0.5) * 50}px`;
                }
            }
        }
    }

    let activeNotes = {}; // To track active notes for touch events

    piano.addEventListener('mousedown', e => {
        if (e.target.classList.contains('key')) {
            const { note, octave } = e.target.dataset;
            noteOn(note, parseInt(octave));
        }
    });

    piano.addEventListener('mouseup', e => {
        if (e.target.classList.contains('key')) {
            const { note, octave } = e.target.dataset;
            noteOff(note, parseInt(octave));
        }
    });

    piano.addEventListener('mouseleave', e => {
        // Stop any active note when mouse leaves the piano area
        // This is a simple approach. A more robust solution would track the specific key.
        synthesizer.allNotesOff(0);
    });

    piano.addEventListener('touchstart', e => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.classList.contains('key')) {
                const { note, octave } = target.dataset;
                noteOn(note, parseInt(octave));
                activeNotes[touch.identifier] = { note, octave: parseInt(octave) };
            }
        }
    }, { passive: false });

    piano.addEventListener('touchend', e => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (activeNotes[touch.identifier]) {
                const { note, octave } = activeNotes[touch.identifier];
                noteOff(note, octave);
                delete activeNotes[touch.identifier];
            }
        }
    });

    piano.addEventListener('touchcancel', e => {
        // Same as touchend
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (activeNotes[touch.identifier]) {
                const { note, octave } = activeNotes[touch.identifier];
                noteOff(note, octave);
                delete activeNotes[touch.identifier];
            }
        }
    });

    drawPiano();
    init();
});