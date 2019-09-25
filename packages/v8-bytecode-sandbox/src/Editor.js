import React, { PureComponent } from 'react';
import {VirtualMachine, Program} from 'v8-vm.js';

import './Editor.css';

const defaultByteCodeAExample = {
    '0x00000001': {
        type: 'StackCheck'
    },
    '0x00000002': {
        type: 'LdaSmi',
        operand: [3],
    },
    '0x00000003': {
        type: 'Star',
        reg: 'r0',
    },
    '0x00000004': {
        type: 'LdaSmi',
        operand: [4],
    },
    '0x00000005': {
        type: 'Star',
        reg: 'r1',
    },
    '0x00000006': {
        type: 'Ldar',
        reg: 'r1',
    },
    '0x00000007': {
        type: 'Add',
        reg: 'r0',
        operand: [0]
    }
};

const defaultByteCodeBExample = {
    '0x00000001': {
        type: 'StackCheck'
    },
    '0x00000002': {
        type: 'LdaSmi',
        operand: [3],
    },
};

const defaultByteCodeCExample = {
    '0x00000001': {
        type: 'StackCheck'
    },
};

export default class Editor extends PureComponent {
    state = {
        codeParseError: null,
        executor: null,
        realm: null,
        code: {},
    };

    area = null;

    componentDidMount() {
        this.loadExample(defaultByteCodeAExample);
    }

    renderByteCode() {
        const { code, codeParseError } = this.state;

        if (codeParseError) {
            return (
                <div className="ByteCodeArea">
                    Unable to parse {codeParseError}
                </div>
            );
        }

        return (
            <div className="ByteCodeArea">
                {Object.entries(code).map(([address, opcode]) => {
                    const active = this.state.realm && this.state.realm.address == address;

                    return (
                        <div className={active ? "Row Row-Active" : "Row"} key={`row-${address}`}>
                            <div>{address}</div>
                            <div>{opcode.type}</div>
                            <div>
                                {JSON.stringify({
                                    reg: opcode.reg,
                                    operand: opcode.operand
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    }

    onNextTickClick = () => {
        if (this.state.executor) {
            const last = this.state.executor.next();

            console.log('tick', last);
    
            if (!last.done) {
                this.setState({
                    realm: last.value,
                })
            }
        }
    }

    renderExecution() {
        const { realm } = this.state;

        return (
            <div className="VmInfoArea">
                <div>
                    <button onClick={this.onNextTickClick}>Next</button>
                    <button>Reset</button>
                </div>
                {
                    realm ? (
                        <div>
                            <div>
                                Accumulator {JSON.stringify(realm.acc)}
                            </div>
                            <div>
                                Registers {JSON.stringify(realm.registers)}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2>No execution</h2>
                        </div> 
                    )
                }
            </div>
        );
    }

    getCodeAsString() {
        return JSON.stringify(this.state.code, null, 2)
    }

    renderEditor() {
        return (
            <textarea
                className="CodeArea"
                onChange={this.onCodeChange}
                defaultValue={this.getCodeAsString()}
                ref={(area) => { this.area = area; }}
            />
        );
    }

    onCodeChange = (e) => {
        try {
            const code = JSON.parse(e.target.value);

            this.setState({
                code,
                codeParseError: null,
            });
        } catch (e) {
            this.setState({
                code: null,
                codeParseError: e,
            });
        }
    }

    loadExample = (code) => {
        this.setState({
            code,
            executor: (new VirtualMachine()).executor(new Program(code)),
        }, () => {
            if (this.area) {
                this.area.value = this.getCodeAsString();
            }
        })
    };

    render() {
        return (
            <div className="Emulator">
                <div>
                    <button onClick={() => this.loadExample(defaultByteCodeAExample)}>
                        Example 1
                    </button>
                    <button onClick={() => this.loadExample(defaultByteCodeBExample)}>
                        Example 2
                    </button>
                    <button onClick={() => this.loadExample(defaultByteCodeCExample)}>
                        Example 3
                    </button>
                </div>
                <div>
                    {this.renderEditor()}
                    {this.renderByteCode()}
                    {this.renderExecution()}
                </div>
            </div>
        )
    }
}