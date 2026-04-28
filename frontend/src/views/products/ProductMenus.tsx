import { useState } from 'react';
import { Button, Card, Modal, Label, TextInput } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { useMenus } from '../../contexts/MenuContext';
import { useNavigate } from 'react-router';
import {
    GiCoffeeCup, GiBeerStein, GiWineGlass, GiHotMeal, GiCakeSlice,
    GiIceCreamCone, GiPizzaSlice, GiHamburger, GiNoodles, GiFishCooked,
    GiChickenOven, GiBreadSlice, GiCarrot, GiFruitBowl, GiCupcake,
    GiForkKnifeSpoon, GiCoffeePot, GiWaterBottle, GiSandwich, GiGamepad
} from 'react-icons/gi';

const TrashIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M822.592 192h14.272a32 32 0 0131.616 26.752l21.312 128A32 32 0 01858.24 384h-49.344l-39.04 546.304A32 32 0 01737.92 960H285.824a32 32 0 01-32-29.696L214.912 384H165.76a32 32 0 01-31.552-37.248l21.312-128A32 32 0 01187.136 192h14.016l-6.72-93.696A32 32 0 01226.368 64h571.008a32 32 0 0131.936 34.304L822.592 192zm-64.128 0l4.544-64H260.736l4.544 64h493.184zm-548.16 128H820.48l-10.688-64H214.208l-10.688 64h6.784zm68.736 64l36.544 512H708.16l36.544-512H279.04z"></path>
    </svg>
);

const BellIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M128 352.576V352a288 288 0 01491.072-204.224 192 192 0 01274.24 204.48 64 64 0 0157.216 74.24C921.6 600.512 850.048 710.656 736 756.992V800a96 96 0 01-96 96H384a96 96 0 01-96-96v-43.008c-114.048-46.336-185.6-156.48-214.528-330.496A64 64 0 01128 352.64zm64-.576h64a160 160 0 01320 0h64a224 224 0 00-448 0zm128 0h192a96 96 0 00-192 0zm439.424 0h68.544A128.256 128.256 0 00704 192c-15.36 0-29.952 2.688-43.52 7.616 11.328 18.176 20.672 37.76 27.84 58.304A64.128 64.128 0 01759.424 352zM672 768H352v32a32 32 0 0032 32h256a32 32 0 0032-32v-32zm-342.528-64h365.056c101.504-32.64 165.76-124.928 192.896-288H136.576c27.136 163.072 91.392 255.36 192.896 288z"></path>
    </svg>
);

const TrophyIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M256 270.912c10.048 6.72 22.464 14.912 28.992 18.624a220.16 220.16 0 00114.752 30.72c30.592 0 49.408-9.472 91.072-41.152l.64-.448c52.928-40.32 82.368-55.04 132.288-54.656 55.552.448 99.584 20.8 142.72 57.408l1.536 1.28V128H256v142.912zm.96 76.288C266.368 482.176 346.88 575.872 512 576c157.44.064 237.952-85.056 253.248-209.984a952.32 952.32 0 01-40.192-35.712c-32.704-27.776-63.36-41.92-101.888-42.24-31.552-.256-50.624 9.28-93.12 41.6l-.576.448c-52.096 39.616-81.024 54.208-129.792 54.208-54.784 0-100.48-13.376-142.784-37.056zM480 638.848C250.624 623.424 192 442.496 192 319.68V96a32 32 0 0132-32h576a32 32 0 0132 32v224c0 122.816-58.624 303.68-288 318.912V896h96a32 32 0 110 64H384a32 32 0 110-64h96V638.848z"></path>
    </svg>
);

const KeyIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M308.352 489.344l226.304 226.304a32 32 0 0045.248 0L783.552 512A192 192 0 10512 240.448L308.352 444.16a32 32 0 000 45.248zm135.744 226.304L308.352 851.392a96 96 0 01-135.744-135.744l135.744-135.744-45.248-45.248a96 96 0 010-135.808L466.752 195.2A256 256 0 01828.8 557.248L625.152 760.96a96 96 0 01-135.808 0l-45.248-45.248zM398.848 670.4L353.6 625.152 217.856 760.896a32 32 0 0045.248 45.248L398.848 670.4zm248.96-384.64a32 32 0 010 45.248L466.624 512a32 32 0 11-45.184-45.248l180.992-181.056a32 32 0 0145.248 0zm90.496 90.496a32 32 0 010 45.248L557.248 602.496A32 32 0 11512 557.248l180.992-180.992a32 32 0 0145.312 0z"></path>
    </svg>
);

const RocketIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M349.952 716.992L478.72 588.16a106.688 106.688 0 01-26.176-19.072 106.688 106.688 0 01-19.072-26.176L304.704 671.744c.768 3.072 1.472 6.144 2.048 9.216l2.048 31.936 31.872 1.984c3.136.64 6.208 1.28 9.28 2.112zm57.344 33.152a128 128 0 11-216.32 114.432l-1.92-32-32-1.92a128 128 0 11114.432-216.32L416.64 469.248c-2.432-101.44 58.112-239.104 149.056-330.048 107.328-107.328 231.296-85.504 316.8 0 85.44 85.44 107.328 209.408 0 316.8-91.008 90.88-228.672 151.424-330.112 149.056L407.296 750.08zm90.496-226.304c49.536 49.536 233.344-7.04 339.392-113.088 78.208-78.208 63.232-163.072 0-226.304-63.168-63.232-148.032-78.208-226.24 0C504.896 290.496 448.32 474.368 497.792 523.84zM244.864 708.928a64 64 0 10-59.84 59.84l56.32-3.52 3.52-56.32zm8.064 127.68a64 64 0 1059.84-59.84l-56.32 3.52-3.52 56.32z"></path>
    </svg>
);

const CupIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M714.432 704a351.744 351.744 0 00148.16-256H161.408a351.744 351.744 0 00148.16 256h404.864zM288 766.592A415.68 415.68 0 0196 416a32 32 0 0132-32h768a32 32 0 0132 32 415.68 415.68 0 01-192 350.592V832a64 64 0 01-64 64H352a64 64 0 01-64-64v-65.408zM493.248 320h-90.496l254.4-254.4a32 32 0 1145.248 45.248L493.248 320zm187.328 0h-128l269.696-155.712a32 32 0 0132 55.424L680.576 320zM352 768v64h320v-64H352z"></path>
    </svg>
);

const MartiniIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M768 64a192 192 0 11-69.952 370.88L480 725.376V896h96a32 32 0 110 64H320a32 32 0 110-64h96V725.376L76.8 273.536a64 64 0 01-12.8-38.4v-10.688a32 32 0 0132-32h71.808l-65.536-83.84a32 32 0 0150.432-39.424l96.256 123.264h337.728A192.064 192.064 0 01768 64zM656.896 192.448H800a32 32 0 0132 32v10.624a64 64 0 01-12.8 38.4l-80.448 107.2a128 128 0 10-81.92-188.16v-.064zm-357.888 64l129.472 165.76a32 32 0 01-50.432 39.36l-160.256-205.12H144l304 404.928 304-404.928H299.008z"></path>
    </svg>
);

const BurgerIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M160 512a32 32 0 00-32 32v64a32 32 0 0030.08 32H864a32 32 0 0032-32v-64a32 32 0 00-32-32H160zm736-58.56A96 96 0 01960 544v64a96 96 0 01-51.968 85.312L855.36 833.6a96 96 0 01-89.856 62.272H258.496A96 96 0 01168.64 833.6l-52.608-140.224A96 96 0 0164 608v-64a96 96 0 0164-90.56V448a384 384 0 11768 5.44zM832 448a320 320 0 00-640 0h640zM512 704H188.352l40.192 107.136a32 32 0 0029.952 20.736h507.008a32 32 0 0029.952-20.736L835.648 704H512z"></path>
    </svg>
);

const GamepadIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M813.176 180.706a60.235 60.235 0 0160.236 60.235v481.883a60.235 60.235 0 01-60.236 60.235H210.824a60.235 60.235 0 01-60.236-60.235V240.94a60.235 60.235 0 0160.236-60.235h602.352zm0-60.235H210.824A120.47 120.47 0 0090.353 240.94v481.883a120.47 120.47 0 00120.47 120.47h602.353a120.47 120.47 0 00120.471-120.47V240.94a120.47 120.47 0 00-120.47-120.47zm-120.47 180.705a30.118 30.118 0 00-30.118 30.118v301.177a30.118 30.118 0 0060.236 0V331.294a30.118 30.118 0 00-30.118-30.118zm-361.412 0a30.118 30.118 0 00-30.118 30.118v301.177a30.118 30.118 0 1060.236 0V331.294a30.118 30.118 0 00-30.118-30.118zM512 361.412a30.118 30.118 0 00-30.118 30.117v30.118a30.118 30.118 0 0060.236 0V391.53A30.118 30.118 0 00512 361.412zM512 512a30.118 30.118 0 00-30.118 30.118v30.117a30.118 30.118 0 0060.236 0v-30.117A30.118 30.118 0 00512 512z"></path>
    </svg>
);

const CompassIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M683.072 600.32l-43.648 162.816-61.824-16.512 53.248-198.528L576 493.248l-158.4 158.4-45.248-45.248 158.4-158.4-55.616-55.616-198.528 53.248-16.512-61.824 162.816-43.648L282.752 200A384 384 0 00824 741.248L683.072 600.32zm231.552 141.056a448 448 0 11-632-632l632 632z"></path>
    </svg>
);

const LampIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M128 416v-48a144 144 0 01168.64-141.888 224.128 224.128 0 01430.72 0A144 144 0 01896 368v48a384 384 0 01-352 382.72V896h-64v-97.28A384 384 0 01128 416zm287.104-32.064h193.792a143.808 143.808 0 0158.88-132.736 160.064 160.064 0 00-311.552 0 143.808 143.808 0 0158.88 132.8zm-72.896 0a72 72 0 10-140.48 0h140.48zm339.584 0h140.416a72 72 0 10-140.48 0zM512 736a320 320 0 00318.4-288.064H193.6A320 320 0 00512 736zM384 896.064h256a32 32 0 110 64H384a32 32 0 110-64z"></path>
    </svg>
);

const MagnifierIcon = () => (
    <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em">
        <path d="M513.28 448a64 64 0 1176.544 49.728A96 96 0 00768 448h64a160 160 0 01-320 0h1.28zm-126.976-29.696a256 256 0 1043.52-180.48A256 256 0 01832 448h-64a192 192 0 00-381.696-29.696zm105.664 249.472L285.696 874.048a96 96 0 01-135.68-135.744l206.208-206.272a320 320 0 11135.744 135.744zm-54.464-36.032a321.92 321.92 0 01-45.248-45.248L195.2 783.552a32 32 0 1045.248 45.248l197.056-197.12z"></path>
    </svg>
);

const ICON_MAP: Record<string, React.ElementType> = {
    GamepadIcon, LampIcon, MagnifierIcon, CompassIcon,
    TrashIcon, BellIcon, TrophyIcon, KeyIcon,
    RocketIcon, CupIcon, MartiniIcon, BurgerIcon,
};

const menuIcons = Object.keys(ICON_MAP);

const DragHandleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
        <path d="M12 2a2 2 0 110 4 2 2 0 010-4zm0 8a2 2 0 110 4 2 2 0 010-4zm0 8a2 2 0 110 4 2 2 0 010-4z" />
    </svg>
);

const ProductMenus = () => {
    const { menus, addMenu, reorderMenus } = useMenus();
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        icon: 'GiHotMeal',
    });
    const [searchTerm, setSearchTerm] = useState('');

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (index: number) => {
        if (draggedIndex !== null && draggedIndex !== index) {
            reorderMenus(draggedIndex, index);
            toast.success('Đã cập nhật thứ tự thực đơn');
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };



    const handleCreate = () => {
        setFormData({ name: '', icon: 'GiHotMeal' });
        setOpenModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên thực đơn');
            return;
        }

        addMenu({
            ...formData,
            productIds: [],
        });

        toast.success('Tạo thực đơn thành công');
        setOpenModal(false);
        setFormData({ name: '', icon: 'GiHotMeal' });
    };

    const handleMenuClick = (menuId: number) => {
        navigate(`/products/menu/${menuId}`);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Thực đơn
                    </h1>
                    <button className="text-gray-400 hover:text-gray-600">
                        <Icon icon="solar:info-circle-outline" className="text-xl" />
                    </button>
                </div>
                <Button color="blue" onClick={handleCreate}>
                    Tạo thực đơn
                </Button>
            </div>

            {/* Main Card */}
            <Card>
                {/* Tab */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex">
                        <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                            Tất cả thực đơn ({menus.length})
                        </button>
                    </div>
                </div>

                {/* Menu List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {menus.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Chưa có thực đơn nào
                        </div>
                    ) : (
                        menus.map((menu, index) => (
                            <div
                                key={menu.id}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={() => handleDrop(index)}
                                className={`
                                    p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group relative transition-all duration-200
                                    ${draggedIndex === index ? 'opacity-40 bg-blue-50' : ''}
                                    ${dragOverIndex === index && draggedIndex !== index ? 'border-t-4 border-blue-500 bg-blue-50/30' : ''}
                                `}
                                onClick={() => handleMenuClick(menu.id)}
                            >
                                {/* Drag Handle */}
                                <div
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnd={handleDragEnd}
                                    title="Ấn giữ vào đây để kéo thả vị trí thực đơn"
                                    className="absolute right-1 opacity-0 group-hover:opacity-100 transition-all p-2 text-gray-400 hover:text-blue-600 cursor-grab active:cursor-grabbing hover:bg-blue-50 rounded-lg z-10"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Icon icon="solar:hamburger-menu-outline" className="text-2xl" />
                                </div>

                                <span className="text-gray-500 text-sm min-w-[30px] ml-6">
                                    {String(index + 1).padStart(2, '0')}.
                                </span>
                                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                                    {(() => {
                                        const IconComponent = ICON_MAP[menu.icon] || GiHotMeal;
                                        return (
                                            <span className="flex items-center justify-center w-full h-full text-gray-600 dark:text-gray-300 text-[32px] leading-none">
                                                <IconComponent className="w-[1em] h-[1em]" />
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-blue-600 font-medium">{menu.name}</h3>
                                    <p className="text-sm text-gray-500">Có {menu.productIds.length} mặt hàng</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Create Menu Modal */}
            <Modal show={openModal} size="4xl" onClose={() => setOpenModal(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>Thêm mới thực đơn</Modal.Header>
                    <Modal.Body>
                        <div className="flex gap-6">
                            {/* Left Column */}
                            <div className="w-2/3 space-y-6">
                                <div>
                                    <Label htmlFor="menuName" value="Tên thực đơn" className="mb-2 block" />
                                    <TextInput
                                        id="menuName"
                                        placeholder="Tên thực đơn"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label value="Thêm mặt hàng, combo, khuyến mại" className="mb-2 block" />
                                    <div className="flex gap-2">
                                        <TextInput
                                            placeholder="Tìm kiếm mặt hàng, combo, khuyến mại"
                                            className="flex-1"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Button color="gray">Tìm kiếm</Button>
                                    </div>
                                </div>

                                {/* Empty State */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                    <Icon icon="solar:shop-2-outline" className="text-6xl text-gray-300 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-600 mb-1">
                                        Thực đơn chưa có mặt hàng nào
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Bạn hãy thêm mới mặt hàng cho thực đơn này nhé
                                    </p>
                                </div>
                            </div>

                            {/* Right Column - Icon Picker */}
                            <div className="w-1/3">
                                <Label className="mb-4 block text-lg font-semibold">Biểu tượng</Label>

                                <div className="grid grid-cols-3 gap-3">
                                    {menuIcons.map((iconName) => {
                                        const IconComponent = ICON_MAP[iconName];
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: iconName })}
                                                className={`
                                                    border-2 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-200 aspect-square overflow-hidden
                                                    ${formData.icon === iconName ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}
                                                `}
                                            >
                                                <span className="w-full h-full flex items-center justify-center text-gray-700 text-[90px] leading-none">
                                                    <IconComponent className="w-[1em] h-[1em]" />
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="justify-end">
                        <Button color="gray" type="button" onClick={() => setOpenModal(false)}>
                            Hủy
                        </Button>
                        <Button color="blue" type="submit">
                            Lưu
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default ProductMenus;
