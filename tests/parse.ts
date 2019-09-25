import * as fs from "fs";

const file = fs.readFileSync(fs.realpathSync(__dirname) + '/1.jsc', {
    encoding: null,
    flag: 'r',
});

const kNumReservationsOffset = 16;
const kHeaderSize = 32;
const kInt32Size = 4;

function POINTER_SIZE_ALIGN() {
}

if (file) {
    console.log(file);
    console.log(file.length);

    // magic number and (internally provided) external reference count
    const a1 = file.readUInt32LE(0);
    // version hash
    const a2 = file.readUInt32LE(4);
    // source hash
    const a3 = file.readUInt32LE(8);
    // cpu features
    const a4 = file.readUInt32LE(12);
    // flag hash
    const a5 = file.readUInt32LE(16);
    // number of reservation size entries
    const kNumReservations = file.readUInt32LE(20);
    // payload length
    const a7 = file.readUInt32LE(24);
    // payload checksum part A
    const kChecksumPartAOffset = file.readUInt32LE(28);
    // payload checksum part B
    const kChecksumPartBOffset = file.readUInt32LE(32);

    const reservations = file.slice(kHeaderSize, kNumReservations * 4);

    console.log({
        kHeaderSize,
        reservationsLength: kNumReservations * 4,
    });

    const reservations_size = file.readUInt32LE(kNumReservationsOffset) * kInt32Size;
    const payload_offset = kHeaderSize + reservations_size;

    const payload = file.slice(payload_offset, 100);

    console.log({
        reservations_size,
        payload_offset,
        payload: {
            payloadA: payload[0]
        }
    });

    console.log({
        a1,
        a2,
        a3,
        a4,
        a5,
        kNumReservations,
        a7,
        kChecksumPartAOffset,
        kChecksumPartBOffset,
        dump: {
            reservations,
            payload,
        }
    })
} else {
    throw new Error('Unable to read compiled file');
}
