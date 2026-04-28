import { useState, useCallback } from 'react';
import { Modal, Button, Label } from 'flowbite-react';
import Cropper from 'react-easy-crop';
import { Icon } from '@iconify/react';
import type { Area } from 'react-easy-crop';

interface ImageCropModalProps {
    open: boolean;
    onClose: () => void;
    imageSrc: string;
    onCropComplete: (croppedImage: Blob) => void;
    aspect?: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // Set canvas size for rotation
    canvas.width = safeArea;
    canvas.height = safeArea;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // Set final canvas size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Clear canvas again to ensure transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.putImageData(
        data,
        0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
        0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, 'image/png');
    });
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    open,
    onClose,
    imageSrc,
    onCropComplete,
    aspect = 3 / 4,
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (location: { x: number; y: number }) => {
        setCrop(location);
    };

    const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            onCropComplete(croppedImage);
            onClose();
        } catch (e) {
        }
    };

    const handleRotateLeft = () => {
        setRotation((prev) => prev - 90);
    };

    const handleRotateRight = () => {
        setRotation((prev) => prev + 90);
    };

    return (
        <Modal show={open} onClose={onClose} size="4xl">
            <Modal.Header>Chỉnh sửa ảnh</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    {/* Crop Area */}
                    <div className="relative h-96 bg-gray-900 rounded-lg overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={aspect}
                            onCropChange={onCropChange}
                            onCropComplete={onCropAreaChange}
                            onZoomChange={setZoom}
                        />
                    </div>

                    {/* Controls */}
                    <div className="space-y-3">
                        {/* Zoom Control */}
                        <div>
                            <Label htmlFor="zoom" className="mb-2 block">
                                Phóng to/thu nhỏ
                            </Label>
                            <div className="flex items-center gap-3">
                                <Icon icon="solar:minimize-outline" className="text-xl" />
                                <input
                                    id="zoom"
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <Icon icon="solar:maximize-outline" className="text-xl" />
                            </div>
                        </div>

                        {/* Rotation Control */}
                        <div>
                            <Label className="mb-2 block">Xoay ảnh</Label>
                            <div className="flex items-center gap-3">
                                <Button size="sm" color="light" onClick={handleRotateLeft}>
                                    <Icon icon="solar:restart-outline" className="mr-2 rotate-180" />
                                    Xoay trái
                                </Button>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <Button size="sm" color="light" onClick={handleRotateRight}>
                                    <Icon icon="solar:restart-outline" className="mr-2" />
                                    Xoay phải
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={handleSave} color="blue">
                    <Icon icon="solar:check-circle-outline" className="mr-2" />
                    Lưu ảnh
                </Button>
                <Button onClick={onClose} color="gray">
                    Hủy
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ImageCropModal;
