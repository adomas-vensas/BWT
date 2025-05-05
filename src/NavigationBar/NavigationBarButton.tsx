export interface NavigationBarButtonProps {
    title: string
    logoPath: string
    navigationPath?: string
    onClick?: () => void
    active?: boolean
  }

export default function NavigationBarButton({title, logoPath, navigationPath ="#", onClick, active = false } : NavigationBarButtonProps){
    return (
        <div
            className={`flex-1 group cursor-pointer ${
                active ? 'text-indigo-500 border-b-indigo-500' : ''
            }`}
            onClick={onClick}>
            <a href={navigationPath} className="flex items-end justify-center text-center mx-auto px-4 pt-2 w-ful
            text-gray-400 group-hover:text-indigo-500 border-b-2 border-transparent group-hover:border-indigo-500">
                <span className={`block px-1 pt-1 pb-2 ${
                            active ? 'opacity-100' : 'opacity-50'
                        }`}>
                    <img
                        src={logoPath}
                        className="w-6 h-6 mx-auto mb-1"
                    />
                    <span className="whitespace-nowrap block text-xs pb-1">{title}</span>
                </span>
            </a>
        </div>
    )
}