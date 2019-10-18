import {VirtualMachine, Program} from '../src';


// function test() {
//     let a = 0;

//     while (a < 100) {

//         a++;
//     }

//     return a;
// }
// 
// 39 E> 0x33053be60556 @    0 : a5                StackCheck 
// 56 S> 0x33053be60557 @    1 : 0b                LdaZero 
//       0x33053be60558 @    2 : 26 fb             Star r0
// 73 S> 0x33053be6055a @    4 : 0c 64             LdaSmi [100]
// 73 E> 0x33053be6055c @    6 : 69 fb 00          TestLessThan r0, [0]
//       0x33053be6055f @    9 : 99 0c             JumpIfFalse [12] (0x33053be6056b @ 21)
// 64 E> 0x33053be60561 @   11 : a5                StackCheck 
// 91 S> 0x33053be60562 @   12 : 25 fb             Ldar r0
//       0x33053be60564 @   14 : 4c 01             Inc [1]
//       0x33053be60566 @   16 : 26 fb             Star r0
//       0x33053be60568 @   18 : 8a 0e 00          JumpLoop [14], [0] (0x33053be6055a @ 4)
// 107 S> 0x33053be6056b @   21 : 25 fb             Ldar r0
// 116 S> 0x33053be6056d @   23 : a9                Return 

const vm = new VirtualMachine();
const executor = vm.executor(
    new Program({
        '0x33053be60556': {
            type: 'StackCheck'
        },
        '0x33053be60557': {
            type: 'LdaZero',
        },
        '0x33053be60558': {
            type: 'Star',
            reg: 'r0',
        },
        '0x33053be6055a': {
            type: 'LdaSmi',
            operand: 100,
        },
        '0x33053be6055c': {
            type: 'TestLessThan',
            reg: 'r0',
        },
        '0x33053be6055f': {
            type: 'JumpIfFalse',
            address: '0x33053be6056b',
        },
        '0x33053be60561': {
            type: 'StackCheck'
        },
        '0x33053be60562': {
            type: 'Ldar',
            reg: 'r0'
        },
        '0x33053be60564': {
            type: 'Inc',
            operand: 1,
        },
        '0x33053be60566': {
            type: 'Star',
            reg: 'r0'
        },
        '0x33053be60568': {
            type: 'JumpLoop',
            address: '0x33053be6055a'
        },
        '0x33053be6056b': {
            type: 'Return',
        },
    })
);

console.log(executor);

for (const op of executor) {
    console.log(op);
}
