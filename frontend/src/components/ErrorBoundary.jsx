import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TaskFlow caught error in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.removeItem('todoist_clone_tasks');
    localStorage.removeItem('todoist_clone_workspaces');
    localStorage.removeItem('todoist_clone_projects');
    localStorage.removeItem('todoist_clone_sections');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF5F8] flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center mx-auto text-2xl font-black shadow-xs">
              !
            </div>
            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 leading-relaxed">
                An unexpected error occurred while loading the view.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-left text-xs font-mono text-neutral-700 max-h-32 overflow-y-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="py-3 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
