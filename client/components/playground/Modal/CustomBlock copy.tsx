import React from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/credeza"
import { Plus } from 'lucide-react'

const formSchema = z.object({
  blockName: z.string().min(1, "Block name is required"),
})

interface CustomBlockModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmitCustomBlock: (values: z.infer<typeof formSchema>) => void
}

export default function CustomBlock({ isOpen, onOpenChange, onSubmitCustomBlock }: CustomBlockModalProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
    },
  })

  return (
    <>
      <div className="pb-12 p-6 w-72 -mt-6">
        <Button
          onClick={() => onOpenChange(true)}
          className="bg-white hover:bg-whte hoverEffect text-black w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Block
        </Button>
      </div>
      <Credenza open={isOpen} onOpenChange={onOpenChange}>
        <CredenzaContent className="border-white/10 bg-[#faf3dd] ">
          <CredenzaHeader>
            <CredenzaTitle className="text-black">Add a Custom Block</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCustomBlock)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="blockName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Block Name</FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          className="w-full p-2 rounded bg-[#d5bdaf] text-black border-2 border-[#2A2A2A] focus:border-[#4A4A4A]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <CredenzaClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </CredenzaClose>
                  <Button type="submit">Create Block</Button>
                </div>
              </form>
            </Form>
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  )
}
