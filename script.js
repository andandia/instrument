document.addEventListener('DOMContentLoaded', () => {
    const piano = document.getElementById('piano');
    const loading = document.getElementById('loading');

    const noteMap = {
        'C': 'ド', 'C#': 'ド#', 'D': 'レ', 'D#': 'レ#', 'E': 'ミ', 'F': 'ファ', 'F#': 'ファ#', 'G': 'ソ', 'G#': 'ソ#', 'A': 'ラ', 'A#': 'ラ#', 'B': 'シ'
    };

    const keys = [
        { note: 'C', type: 'white' }, { note: 'C#', type: 'black' }, { note: 'D', type: 'white' }, { note: 'D#', type: 'black' }, { note: 'E', type: 'white' },
        { note: 'F', type: 'white' }, { note: 'F#', type: 'black' }, { note: 'G', type: 'white' }, { note: 'G#', type: 'black' }, { note: 'A', type: 'white' }, { note: 'A#', type: 'black' }, { note: 'B', type: 'white' }
    ];

    let player;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    async function init() {
        try {
            const response = await fetch('resource/piano.sf2');
            const sf2 = await response.arrayBuffer();
            player = new Sf2Player(audioContext);
            await player.load(sf2);
            loading.style.display = 'none';
        } catch (error) {
            loading.textContent = 'Error loading sounds.';
            console.error('Error loading SoundFont:', error);
        }
    }

    function playNote(note, octave) {
        if (!player) return;
        const midiNote = noteToMidi(note, octave);
        player.play(midiNote);
    }

    function noteToMidi(note, octave) {
        const noteIndex = keys.findIndex(k => k.note === note);
        return 12 + (octave * 12) + noteIndex;
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

    piano.addEventListener('mousedown', e => {
        if (e.target.classList.contains('key')) {
            const { note, octave } = e.target.dataset;
            playNote(note, parseInt(octave));
        }
    });

    piano.addEventListener('touchstart', e => {
        if (e.target.classList.contains('key')) {
            e.preventDefault();
            const { note, octave } = e.target.dataset;
            playNote(note, parseInt(octave));
        }
    }, { passive: false });

    drawPiano();
    init();
});
