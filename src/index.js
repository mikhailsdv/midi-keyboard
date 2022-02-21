const {DEFAULT_KEYBOARD, REPEAT_TIMEOUT, REPEAT_INTERAL, CAPS_VELOSITY} = require("./config.js")
const keyboards = require("./keyboards.json")
const easymidi = require("easymidi")
const clipboardy = import("clipboardy")
const ks = require("node-key-sender")

clipboardy.then(clipboard => {
	const typeString = str => {
		console.log(str)
		clipboard.default.writeSync(str)
		ks.sendCombination(["control", "v"])
	}

	const pressedKeys = {}
	const pressKey = (id, f) => {
		f()
		pressedKeys[id] = {
			repeatTimeout: setTimeout(() => {
				pressedKeys[id].repeatInterval = setInterval(() => {
					f()
				}, REPEAT_INTERAL)
			}, REPEAT_TIMEOUT),
		}
	}
	const unpressKey = id => {
		clearTimeout(pressedKeys[id]?.repeatTimeout)
		clearInterval(pressedKeys[id]?.repeatInterval)
		pressedKeys[id] = null
	}

	const inputs = easymidi.getInputs()
	if (inputs.length) {
		const input = new easymidi.Input(inputs[0])

		input.on("cc", ({value, controller}) => {
			if (controller === 64 && value > 0) {
				pressKey(0, () => ks.sendKey("space"))
			} else {
				unpressKey(0)
			}
		})

		input.on("noteon", ({note, velocity}) => {
			const keyboardItem = keyboards[DEFAULT_KEYBOARD][note] || {type: "text", text: String(note)}
			if (keyboardItem.type === "text") {
				let letter = keyboardItem.text
				velocity > CAPS_VELOSITY && (letter = letter.toUpperCase())
				if (velocity > 0) {
					pressKey(note, () => typeString(letter))
				} else {
					unpressKey(note)
				}
			} else if (keyboardItem.type === "key") {
				if (velocity > 0) {
					pressKey(note, () => ks.sendKey(keyboardItem.key))
				} else {
					unpressKey(note)
				}
			}
		})
	} else {
		console.log("No MIDI device found")
	}
})
