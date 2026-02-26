
import React from 'react';
import Link from 'next/link';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getServiceData } from '@/lib/seo/programmatic-data';
import { notFound } from 'next/navigation';

export default async function ServiceVerticalPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const service = await getServiceData(slug);

    if (!service) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <SchemaGenerator type="ServiceVertical" data={{ service }} />

            <nav className="text-sm breadcrumbs mb-6 text-slate-500">
                <ul className="flex gap-2">
                    <li><Link href="/" className="hover:underline">Home</Link></li>
                    <li>/</li>
                    <li><Link href="/services" className="hover:underline">Services</Link></li>
                    <li>/</li>
                    <li className="font-bold text-slate-900">{service.name}</li>
                </ul>
            </nav>

            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-6">
                    {service.name} Services: The Complete Guide
                </h1>
                <p className="text-xl text-slate-600">
                    Everything you need to know about hiring {service.name.toLowerCase()} providers for oversize loads.
                    Regulations, requirements, and verified operators.
                </p>
            </header>

            <section className="prose prose-slate max-w-none mb-12">
                <h2>What is a {service.name}?</h2>
                <p>{service.description} Essential for safe transport of over-dimensional freight...</p>

                <h2>When is it required?</h2>
                <p>State regulations vary, but generally...</p>

                <h2>Equipment Standards</h2>
                <ul>
                    <li>Amber lights (SAE J845 Class 1)</li>
                    <li>CB Radio</li>
                    <li>Height pole (if applicable)</li>
                </ul>
            </section>

            <section className="bg-blue-50 p-8 rounded-xl border border-blue-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Find {service.name} Providers by State</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Mock State Links */}
                    {['Florida', 'Texas', 'Georgia', 'California'].map(state => (
                        <Link
                            key={state}
                            href={`/us/${state.toLowerCase().substring(0, 2)}/cross-city/${slug}`} // Mock city link for demo
                            className="text-blue-600 hover:underline"
                        >
                            {state}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
