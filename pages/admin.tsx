import AdminDashboard from "../AdminDashboard"
import Layout from "../components/Layout"
import ErrorBoundary from "../components/ErrorBoundary"

export default function AdminPage() {
    return (
        <Layout>
            <ErrorBoundary>
                <AdminDashboard />
            </ErrorBoundary>
        </Layout>
    )
}
