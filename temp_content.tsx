            {/* Tabs & Content Area */}
            <GlassPanel className="min-h-[400px]">
              {/* Tab Navigation */}
              <div className="flex overflow-x-auto border-b border-white/10 p-2 scrollbar-none snap-x">
                {navigationSections.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveSection(item.label)}
                    className={`
                      flex-1 relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                      ${activeSection === item.label
                        ? 'text-brand-primary bg-brand-primary/10 shadow-[inner_0_0_10px_rgba(var(--brand-primary-rgb),0.1)]'
                        : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 sm:p-8 animate-fade-in">
                {activeSection === 'Overview' && (
                  <div className="space-y-8 w-full">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">About this Topic</h3>
                      <p className="text-lg leading-relaxed text-slate-600 dark:text-white/70 font-light">
                        {course.longDescription || course.description}
                      </p>
                    </div>

                    {course.learningOutcomes && (
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-400" />
                          Key Takeaways
                        </h4>
                        <ul className="grid sm:grid-cols-2 gap-4">
                          {course.learningOutcomes.map((item, i) => (
                            <li key={i} className="flex gap-3 text-slate-600 dark:text-white/70 text-sm">
                              <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'Resources' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Downloadable Materials</h3>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-slate-500 dark:text-white/50">{resourcesCount} Files</span>
                    </div>

                    {course.resources && course.resources.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {course.resources.map(res => (
                          <div key={res.id} className="interactive-card p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-primary/30 hover:bg-white/10 cursor-pointer">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500 group-hover:scale-110 transition-transform">
                                <File className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-slate-800 dark:text-white group-hover:text-brand-primary transition-colors">{res.name}</p>
                                <p className="text-xs text-slate-500 dark:text-white/40 mt-1">PDF Document</p>
                              </div>
                              <Download className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <Inbox className="h-12 w-12 opacity-50 mb-3" />
                        <p>No resources available just yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'Add task' && (
                  <div className="w-full">
                    <div className="relative mb-8 group">
                      <input
                        type="text"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        placeholder="What's your next goal?"
                        className="w-full pl-6 pr-32 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
                      />
                      <button
                        onClick={handleAddTask}
                        className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/25"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                          <button className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400 dark:border-white/30 group-hover:border-brand-primary'}`} aria-label="Toggle task status">
                            {task.status === 'Completed' && <Check className="h-3.5 w-3.5 text-white" />}
                          </button>
                          <span className={`text-lg transition-all ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-white/30' : 'text-slate-800 dark:text-white'}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {tasks.length === 0 && <p className="text-center text-slate-500 dark:text-white/40 italic">Start by adding a task above.</p>}
                    </div>
                  </div>
                )}

                {activeSection === 'My doubts' && (
                  <div className="w-full space-y-4">
                    <textarea
                      className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all resize-none min-h-[160px] text-lg placeholder:text-slate-400 dark:placeholder:text-white/30"
                      placeholder="Ask a question about this lecture..."
                    />
                    <div className="flex justify-end">
                      <GlassButton className="px-8 py-3 rounded-xl bg-brand-primary/80 hover:bg-brand-primary text-white font-semibold shadow-lg shadow-brand-primary/20">
                        Post Question
                      </GlassButton>
                    </div>
                  </div>
                )}

                {activeSection === 'Simulations' && (
                  <div className="space-y-6">
                    {course.simulations && course.simulations.length > 0 ? (
                      <div className="grid gap-6 sm:grid-cols-2">
                        {course.simulations.map((sim) => (
                          <div key={sim.id} className="interactive-card group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 p-8 text-white shadow-2xl">
                            <div className="relative z-10">
                              <h4 className="text-2xl font-bold mb-2">{sim.title}</h4>
                              <p className="text-indigo-100 mb-6">{sim.description}</p>
                              <a
                                href={sim.launchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-2.5 bg-white/20 backdrop-blur-md rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/10 text-white"
                              >
                                Launch Simulation
                              </a>
                            </div>
                            <img
                              src={sim.thumbnail}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <Cpu className="absolute -bottom-4 -right-4 h-40 w-40 text-white/5 rotate-12 group-hover:rotate-6 transition-all duration-500" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <Cpu className="h-16 w-16 opacity-30 mb-4" />
                        <h4 className="text-lg font-medium text-slate-600 dark:text-slate-300">No simulations active</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Interactive labs for this course are coming soon.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassPanel>
