'use client'

import * as React from "react"
import Image from "next/image"
import { Connector, useConnect, useDisconnect } from "@starknet-react/core"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Wallet, X } from "lucide-react"

const imageLoader = ({ src }: { src: string }) => src

interface WalletButtonProps {
  name: string
  alt: string
  src: string
  connector: Connector
}

const WalletButton: React.FC<WalletButtonProps> = ({ name, alt, src, connector }) => {
  const { connect } = useConnect()
  const isSvg = src?.startsWith("<svg")

  const handleConnectWallet = () => {
    connect({ connector })
    localStorage.setItem("lastUsedConnector", connector.name)
  }
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-4 p-4 hover:bg-muted"
      onClick={handleConnectWallet}
    >
      <div className="h-10 w-10 rounded-md overflow-hidden">
        {isSvg ? (
          <div
            className="h-full w-full object-cover"
            dangerouslySetInnerHTML={{ __html: src ?? "" }}
          />
        ) : (
          <Image
            alt={alt}
            loader={imageLoader}
            unoptimized
            src={src}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <span className="flex-1 text-left">{name}</span>
    </Button>
  )
}

const ConnectModal: React.FC = () => {
  const { connectors } = useConnect()

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Connect a Wallet</DialogTitle>
      </DialogHeader>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {connectors.map((connector, index) => (
            <WalletButton
              key={connector.id || index}
              src={typeof connector.icon === 'object' ? connector.icon.light : connector.icon}
              name={connector.name}
              connector={connector}
              alt={`${connector.name} icon`}
            />
          ))}
        </div>
      </ScrollArea>
    </DialogContent>
  )
}

interface ConnectButtonProps {
  text?: string
  className?: string
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  text = "Connect Wallet",
  className = "text-black",
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={className} variant="outline">
          <Wallet className="mr-2 h-4 w-4" />
          {text}
        </Button>
      </DialogTrigger>
      <ConnectModal />
    </Dialog>
  )
}

const DisconnectButton: React.FC = () => {
  const { disconnect } = useDisconnect({})
  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDisconnect}
    >
      <X className="h-4 w-4 mr-2" />
      Disconnect
    </Button>
  )
}

export { ConnectButton, DisconnectButton }