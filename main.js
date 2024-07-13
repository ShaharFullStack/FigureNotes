// Create an audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Variable to store the selected waveform
let selectedWaveform = 'sine';

// Create a convolver node for reverb
const convolver = audioContext.createConvolver();

// Create a delay node
const delayNode = audioContext.createDelay();
delayNode.delayTime.value = 0; // Start with no delay

// Gain node for wet/dry mix of reverb
const reverbGainNode = audioContext.createGain();
reverbGainNode.gain.value = 0;

// Gain node for overall volume control
const masterGainNode = audioContext.createGain();
masterGainNode.gain.value = 0.5; // Default volume

// Load a simple reverb impulse response (could be a short noise burst)
fetch('impulse-response.wav')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.arrayBuffer();
    })
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        convolver.buffer = audioBuffer;
    })
    .catch(error => {
        console.error('Error loading or decoding impulse response:', error);
    });

let activeOscillator = null;

// Function to create and start an oscillator with the selected waveform
function startTone(frequency) {
    // Ensure frequency is finite
    if (!isFinite(frequency)) {
        console.error('Invalid frequency:', frequency);
        return;
    }

    // Create an oscillator node
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = selectedWaveform; // Use the selected waveform

    // Create a gain node to control the volume
    const gainNode = audioContext.createGain();

    // Apply an envelope to the gain (volume)
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.7, now + 0.01); // Attack
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1); // Decay
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.2); // Sustain

    // Connect the oscillator to the gain node
    oscillator.connect(gainNode);

    // Connect the gain node to both the convolver (reverb) and the delay node
    gainNode.connect(convolver);
    gainNode.connect(delayNode);
    convolver.connect(reverbGainNode);
    reverbGainNode.connect(masterGainNode);
    delayNode.connect(masterGainNode);
    masterGainNode.connect(audioContext.destination);

    // Start the oscillator
    oscillator.start();

    // Store the active oscillator so it can be stopped later
    activeOscillator = oscillator;
}

// Function to stop the currently active oscillator
function stopTone() {
    if (activeOscillator) {
        activeOscillator.stop();
        activeOscillator = null;
    }
}

// Map note names and octaves to their corresponding frequencies
const noteFrequencies = {
    'C': [261.63, 523.25, 1046.50, 2093.00, 4186.01],
    'C#': [277.18, 554.37, 1108.73, 2217.46, 4434.92],
    'D': [293.66, 587.33, 1174.66, 2349.32, 4698.63],
    'D#': [311.13, 622.25, 1244.51, 2489.02, 4978.03],
    'E': [329.63, 659.25, 1318.51, 2637.02, 5274.04],
    'F': [349.23, 698.46, 1396.91, 2793.83, 5587.65],
    'F#': [369.99, 739.99, 1479.98, 2959.96, 5919.91],
    'G': [392.00, 783.99, 1567.98, 3135.96, 6271.93],
    'G#': [415.30, 830.61, 1661.22, 3322.44, 6644.88],
    'A': [440.00, 880.00, 1760.00, 3520.00, 7040.00],
    'A#': [466.16, 932.33, 1864.66, 3729.31, 7458.62],
    'B': [493.88, 987.77, 1975.53, 3951.07, 7902.13]
};

// Add event listeners to the waveform buttons
document.querySelectorAll('.waveform').forEach(button => {
    button.addEventListener('click', () => {
        selectedWaveform = button.getAttribute('data-wave');
    });
});

// Add event listeners to the note buttons for mouse and touch events
document.querySelectorAll('.note').forEach(button => {
    const note = button.textContent.trim();
    const octaveClass = Array.from(button.classList).find(cls => cls.startsWith('octave-'));
    const octave = parseInt(octaveClass.split('-')[1], 10);
    const frequency = noteFrequencies[note][octave - 1];

    button.addEventListener('mousedown', () => startTone(frequency));
    button.addEventListener('mouseup', stopTone);
    button.addEventListener('mouseleave', stopTone);
    button.addEventListener('touchstart', (event) => {
        event.preventDefault();
        startTone(frequency);
    });
    button.addEventListener('touchend', (event) => {
        event.preventDefault();
        stopTone();
    });
    button.addEventListener('touchcancel', (event) => {
        event.preventDefault();
        stopTone();
    });
});

// Add event listeners to the reverb and delay knobs
document.getElementById('reverb').addEventListener('input', event => {
    reverbGainNode.gain.value = event.target.value;
});

document.getElementById('delay').addEventListener('input', event => {
    delayNode.delayTime.value = event.target.value;
});

// Add event listener to the volume knob
document.getElementById('volume').addEventListener('input', event => {
    masterGainNode.gain.value = event.target.value;
});
