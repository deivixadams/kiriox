import Link from 'next/link';
import { ArrowLeft, UserCog } from 'lucide-react';
import UserWizard from '../_components/UserWizard';
import { redirect } from 'next/navigation';

export default async function EditUserPage(props: any) {
    // Handle params as either Promise (Next 15) or plain object (Next 14)
    const resolvedParams = await props.params;
    const id = resolvedParams?.id;

    if (!id || id === 'nuevo') {
        redirect('/admin/usuarios');
        return null; // unreachable but safe
    }

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/usuarios"
                        className="p-2 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700 shadow-lg"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <UserCog className="text-blue-400" />
                            Editar Usuario
                        </h1>
                        <p className="text-slate-400 text-sm">Modifica los datos del perfil y sus alcances</p>
                    </div>
                </div>
            </div>

            <UserWizard key={id} mode="edit" userId={id} />
        </div>
    );
}
