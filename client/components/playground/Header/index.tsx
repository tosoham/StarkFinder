/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import Compile from '../Modal/Compile';

interface HeaderProps {
    showClearButton: boolean;
    showFinishButton: boolean;
    handleClear: () => void;
    nodes: any; // Replace 'NodeType' with the appropriate type if known
    edges: any; // Replace 'any' with the appropriate type if known
    flowSummary: any; // Replace 'any' with the appropriate type if known
    selectedNode: any; // Replace 'any' with the appropriate type if known
    handleDelete: (node: any) => void; // Replace 'any' with the appropriate type if known
}

export default function Header({ showClearButton, showFinishButton, handleClear, nodes, edges, flowSummary, selectedNode, handleDelete }: HeaderProps) {
    const [isEditing, setIsEditing] = useState(false); // To track if we are editing
    const [text, setText] = useState("DevXStark");
    const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
    const showDeleteButton = !!selectedNode;

    return (
        <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-4 ml-8">
                {isEditing ? (
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
                        className="text-2xl text-black font-semibold bg-transparent outline-none border-b border-white"
                        autoFocus
                    />
                ) : (
                    <h2 className="text-2xl font-semibold text-black cursor-pointer" onClick={() => setIsEditing(true)}>
                        {text.length > 0 ? text : "Project Name"}
                    </h2>
                )}
            </div>
            <div className="flex gap-2">
                {showDeleteButton && (
                    <Button
                        onClick={() => handleDelete(selectedNode)}
                        className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
                    >
                        Delete node
                    </Button>
                )}
                {showClearButton && (
                    <Button
                        onClick={handleClear}
                        className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
                    >
                        Clear
                    </Button>
                )}
                {showFinishButton && <Compile nodes={nodes} edges={edges} isOpen={isCompileModalOpen} onOpenChange={setIsCompileModalOpen} flowSummary={flowSummary} />}
            </div>
        </div>
    )
}
