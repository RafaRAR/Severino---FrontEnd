import React, { useState, useRef } from 'react';
import { BaseModal } from './ui/BaseModal';
import { Button } from './ui/Button';
import { UploadCloud, X } from 'lucide-react';
import { enviarVerificacao } from '../services/api';
import { toast } from 'react-toastify';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    cadastroId: number;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, cadastroId }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecione uma imagem válida.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('A imagem deve ter no máximo 10MB.');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!imageFile) {
            toast.error('Selecione uma foto para enviar.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('Imagem', imageFile); // nome do campo conforme backend

        try {
            await enviarVerificacao(cadastroId, formData);
            toast.success('Foto enviada com sucesso! Sua análise será feita em breve.');
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar verificação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        toast.info('Você pode fazer a verificação depois na área de perfil.');
        onClose();
    };

    const clearImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <BaseModal title="Verificação de Identidade (Opcional)" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Envie uma foto segurando um documento de identidade (RG, CNH) para ganhar o selo de
                    <strong> Profissional Verificado</strong> e aumentar suas chances de fechar negócios.
                </p>

                <div
                    className="mt-2 flex justify-center items-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-brand-orange transition-colors bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <div className="relative">
                            <img src={previewUrl} alt="Prévia" className="h-32 w-auto rounded-lg object-cover" />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <UploadCloud size={40} className="mx-auto text-gray-400" />
                            <span className="font-semibold text-brand-navy">Clique para selecionar uma foto</span>
                            <span className="text-xs text-gray-500 block">JPG, PNG até 10MB</span>
                        </div>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="outline" onClick={handleSkip}>Pular por enquanto</Button>
                    <Button variant="default" onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-orange hover:bg-orange-600">
                        {isSubmitting ? 'Enviando...' : 'Enviar para Análise'}
                    </Button>
                </div>
            </div>
        </BaseModal>
    );
};